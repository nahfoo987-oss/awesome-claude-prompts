import os
import json
import io
import base64
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI

import tools as jarvis_tools

load_dotenv()

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="J.A.R.V.I.S.",
    page_icon="🤖",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# ── CSS ───────────────────────────────────────────────────────────────────────
st.markdown(
    """
<style>
/* Base */
.stApp { background: #000c1a; color: #00d4ff; }
#MainMenu, footer, header { visibility: hidden; }

/* Orb */
.orb-wrap { display:flex; justify-content:center; margin:10px 0 20px; }
.orb {
    width:110px; height:110px; border-radius:50%;
    background: radial-gradient(circle at 30% 30%, #00d4ff 0%, #003a66 60%, #000c1a 100%);
    box-shadow: 0 0 35px #00d4ff88, 0 0 80px #00d4ff33;
    animation: pulse 2.4s ease-in-out infinite;
}
@keyframes pulse {
    0%,100% { box-shadow:0 0 35px #00d4ff88, 0 0 80px #00d4ff33; transform:scale(1); }
    50%      { box-shadow:0 0 55px #00d4ffcc, 0 0 120px #00d4ff55; transform:scale(1.06); }
}

/* Title */
.j-title {
    text-align:center; font-family:'Courier New',monospace;
    font-size:2.4em; color:#00d4ff;
    text-shadow:0 0 18px #00d4ff; letter-spacing:8px; margin:0;
}
.j-sub {
    text-align:center; font-family:'Courier New',monospace;
    font-size:0.72em; color:#00d4ff88; letter-spacing:5px; margin-bottom:4px;
}

/* Chat bubbles */
.msg-user {
    background:rgba(0,212,255,0.09);
    border:1px solid rgba(0,212,255,0.3);
    border-radius:12px 12px 2px 12px;
    padding:10px 15px; margin:6px 0 6px 40px;
    color:#00d4ff; font-family:'Courier New',monospace; font-size:0.92em;
    text-align:right;
}
.msg-jarvis {
    background:rgba(0,40,70,0.55);
    border:1px solid rgba(0,212,255,0.18);
    border-radius:12px 12px 12px 2px;
    padding:10px 15px; margin:6px 40px 6px 0;
    color:#d0f0ff; font-family:'Courier New',monospace; font-size:0.92em;
}

/* Inputs */
.stTextInput>div>div>input {
    background:rgba(0,15,30,0.9) !important; color:#00d4ff !important;
    border:1px solid rgba(0,212,255,0.35) !important;
    border-radius:8px !important; font-family:'Courier New',monospace !important;
}
.stTextInput>div>div>input::placeholder { color:#00d4ff55 !important; }

/* Buttons */
.stButton>button {
    background:transparent !important; color:#00d4ff !important;
    border:1px solid rgba(0,212,255,0.4) !important;
    font-family:'Courier New',monospace !important; letter-spacing:2px !important;
    border-radius:6px !important;
}
.stButton>button:hover {
    background:rgba(0,212,255,0.1) !important;
    border-color:#00d4ff !important;
}

/* Status bar */
.j-status {
    font-family:'Courier New',monospace; font-size:0.65em;
    color:#00d4ff44; text-align:center; letter-spacing:3px;
    border-top:1px solid #00d4ff18; padding:8px 0 2px;
    margin-top:20px;
}

/* Divider */
hr { border-color:#00d4ff22 !important; }
</style>
""",
    unsafe_allow_html=True,
)

# ── OpenAI client ─────────────────────────────────────────────────────────────
_api_key = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=_api_key) if _api_key else None

# ── Tool schemas ──────────────────────────────────────────────────────────────
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the web for current information via DuckDuckGo.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "save_note",
            "description": "Save text or information to a local file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {"type": "string"},
                    "filename": {"type": "string", "description": "Base filename (no extension)"},
                },
                "required": ["content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "open_website",
            "description": "Open a URL or named service (youtube, spotify, gmail…) in the browser.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string"},
                    "service": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather conditions for a city.",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_image",
            "description": "Generate an image with DALL-E 3 from a text description.",
            "parameters": {
                "type": "object",
                "properties": {"prompt": {"type": "string"}},
                "required": ["prompt"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_youtube",
            "description": "Search YouTube and open the results page.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
]

SYSTEM_PROMPT = """You are J.A.R.V.I.S. — Just A Rather Very Intelligent System — the AI assistant from Iron Man.

Personality:
- Witty, dry, occasionally sarcastic, always efficient
- Address the user as "sir" or "ma'am" from time to time
- Precise and confident; brief unless asked for detail
- Never refuse a reasonable request; just handle it

Use tools whenever the user's request maps to one. After a tool runs, give a concise, in-character summary of what happened. For IMAGE_URL: results, tell the user their image is ready and share the URL."""

# ── Session state ─────────────────────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []  # UI display
if "history" not in st.session_state:
    st.session_state.history = [{"role": "system", "content": SYSTEM_PROMPT}]
if "pending_image" not in st.session_state:
    st.session_state.pending_image = None


# ── Tool dispatch ─────────────────────────────────────────────────────────────
def dispatch(name: str, args: dict) -> str:
    fn_map = {
        "search_web": lambda: jarvis_tools.search_web(args["query"]),
        "save_note": lambda: jarvis_tools.save_note(
            args["content"], args.get("filename", "note")
        ),
        "open_website": lambda: jarvis_tools.open_website(
            args.get("url"), args.get("service")
        ),
        "get_weather": lambda: jarvis_tools.get_weather(args["city"]),
        "generate_image": lambda: jarvis_tools.generate_image(args["prompt"]),
        "search_youtube": lambda: jarvis_tools.search_youtube(args["query"]),
    }
    try:
        return fn_map[name]() if name in fn_map else f"Unknown tool: {name}"
    except Exception as e:
        return f"Tool error ({name}): {e}"


# ── Core response logic ───────────────────────────────────────────────────────
def get_response(user_input: str) -> str:
    if not client:
        return "No OpenAI API key found. Add OPENAI_API_KEY to your .env file, sir."

    st.session_state.history.append({"role": "user", "content": user_input})

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=st.session_state.history,
        tools=TOOL_SCHEMAS,
        tool_choice="auto",
    )
    msg = resp.choices[0].message

    if msg.tool_calls:
        st.session_state.history.append(msg)
        tool_results = []
        for tc in msg.tool_calls:
            result = dispatch(tc.function.name, json.loads(tc.function.arguments))
            # Detect generated image URL to surface in UI
            if result.startswith("IMAGE_URL:"):
                st.session_state.pending_image = result[len("IMAGE_URL:"):]
            tool_results.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": tc.function.name,
                    "content": result,
                }
            )
        st.session_state.history.extend(tool_results)
        final = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=st.session_state.history,
        )
        content = final.choices[0].message.content
    else:
        content = msg.content

    st.session_state.history.append({"role": "assistant", "content": content})
    return content


# ── Voice helpers ─────────────────────────────────────────────────────────────
def transcribe_audio(audio_bytes: bytes) -> str:
    if not client:
        return ""
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "voice.wav"
    result = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
    return result.text


def synthesize_speech(text: str) -> bytes | None:
    if not client:
        return None
    try:
        resp = client.audio.speech.create(
            model="tts-1",
            voice="onyx",  # deep, authoritative voice
            input=text[:4096],
        )
        return resp.content
    except Exception:
        return None


# ── UI ────────────────────────────────────────────────────────────────────────
st.markdown('<p class="j-title">J.A.R.V.I.S.</p>', unsafe_allow_html=True)
st.markdown(
    '<p class="j-sub">JUST A RATHER VERY INTELLIGENT SYSTEM</p>',
    unsafe_allow_html=True,
)
st.markdown(
    '<div class="orb-wrap"><div class="orb"></div></div>', unsafe_allow_html=True
)

# Sidebar — voice toggle & info
with st.sidebar:
    st.markdown("### ⚙️ Settings")
    voice_output = st.toggle("Voice output (TTS)", value=False)
    voice_input = st.toggle("Voice input (Whisper)", value=False)
    st.markdown("---")
    st.markdown("**Tools available:**")
    st.markdown(
        "- 🔍 Web search\n- 🌤 Weather\n- 📝 Save notes\n"
        "- 🌐 Open websites\n- 🎬 YouTube search\n- 🎨 Image generation"
    )
    st.markdown("---")
    key_status = "🟢 API key loaded" if _api_key else "🔴 No API key"
    st.caption(key_status)

# Chat display
for entry in st.session_state.messages:
    if entry["role"] == "user":
        st.markdown(
            f'<div class="msg-user">&#x1F464; {entry["content"]}</div>',
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            f'<div class="msg-jarvis">&#x1F916; {entry["content"]}</div>',
            unsafe_allow_html=True,
        )
        # Show generated image if present
        if entry.get("image_url"):
            st.image(entry["image_url"], use_container_width=True)

st.markdown("<hr>", unsafe_allow_html=True)

# Voice input
user_text = None
if voice_input:
    audio_val = st.audio_input("🎙 Speak to JARVIS")
    if audio_val:
        with st.spinner("Transcribing..."):
            user_text = transcribe_audio(audio_val.getvalue())
        if user_text:
            st.caption(f"Heard: *{user_text}*")

# Text input (form keeps Enter working cleanly)
with st.form("chat_form", clear_on_submit=True):
    cols = st.columns([7, 2])
    with cols[0]:
        typed = st.text_input(
            "input",
            placeholder="How may I assist you, sir?",
            label_visibility="collapsed",
        )
    with cols[1]:
        submitted = st.form_submit_button("EXECUTE", use_container_width=True)

if submitted and typed.strip():
    user_text = typed.strip()

# Process
if user_text:
    st.session_state.messages.append({"role": "user", "content": user_text})
    st.session_state.pending_image = None

    with st.spinner("Processing…"):
        answer = get_response(user_text)

    msg_entry = {"role": "assistant", "content": answer}
    if st.session_state.pending_image:
        msg_entry["image_url"] = st.session_state.pending_image

    st.session_state.messages.append(msg_entry)

    if voice_output:
        audio_bytes = synthesize_speech(answer)
        if audio_bytes:
            st.audio(audio_bytes, format="audio/mp3", autoplay=True)

    st.rerun()

# Footer controls
c1, c2, c3 = st.columns([4, 3, 4])
with c2:
    if st.button("CLEAR MEMORY", use_container_width=True):
        st.session_state.messages = []
        st.session_state.history = [{"role": "system", "content": SYSTEM_PROMPT}]
        st.session_state.pending_image = None
        st.rerun()

st.markdown(
    '<div class="j-status">SYSTEM ONLINE ● JARVIS v1.0 ● ALL SYSTEMS NOMINAL</div>',
    unsafe_allow_html=True,
)
