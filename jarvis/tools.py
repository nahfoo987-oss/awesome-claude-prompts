import os
import webbrowser
import requests
from datetime import datetime
from pathlib import Path

try:
    from duckduckgo_search import DDGS
    DDG_AVAILABLE = True
except ImportError:
    DDG_AVAILABLE = False

NOTES_DIR = Path("jarvis_notes")
IMAGES_DIR = Path("jarvis_images")
NOTES_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)

SERVICE_URLS = {
    "youtube": "https://www.youtube.com",
    "google": "https://www.google.com",
    "spotify": "https://open.spotify.com",
    "netflix": "https://www.netflix.com",
    "github": "https://www.github.com",
    "gmail": "https://mail.google.com",
    "maps": "https://maps.google.com",
    "reddit": "https://www.reddit.com",
    "twitter": "https://www.twitter.com",
    "x": "https://www.x.com",
}


def search_web(query: str) -> str:
    if not DDG_AVAILABLE:
        return "Web search unavailable — install duckduckgo-search."
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
        if not results:
            return "No results found."
        lines = []
        for i, r in enumerate(results, 1):
            lines.append(f"{i}. **{r['title']}**\n   {r['body'][:250]}...")
        return "\n\n".join(lines)
    except Exception as e:
        return f"Search failed: {e}"


def save_note(content: str, filename: str = "note") -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe = "".join(c for c in filename if c.isalnum() or c in "_ -")
    filepath = NOTES_DIR / f"{safe}_{timestamp}.txt"
    filepath.write_text(content, encoding="utf-8")
    return f"Note saved to `{filepath}`."


def open_website(url: str = None, service: str = None) -> str:
    if service:
        key = service.lower()
        url = SERVICE_URLS.get(key, f"https://www.{key}.com")
    if not url:
        return "No URL or service specified."
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    webbrowser.open(url)
    return f"Opened {url} in your browser."


def get_weather(city: str) -> str:
    try:
        resp = requests.get(
            f"https://wttr.in/{city.replace(' ', '+')}?format=j1", timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        cur = data["current_condition"][0]
        desc = cur["weatherDesc"][0]["value"]
        return (
            f"**{city}** — {desc}\n"
            f"Temp: {cur['temp_C']}°C / {cur['temp_F']}°F "
            f"(feels like {cur['FeelsLikeC']}°C)\n"
            f"Humidity: {cur['humidity']}%  |  Wind: {cur['windspeedKmph']} km/h"
        )
    except Exception as e:
        return f"Weather lookup failed for '{city}': {e}"


def generate_image(prompt: str) -> str:
    from openai import OpenAI
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        resp = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        url = resp.data[0].url
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ref = IMAGES_DIR / f"image_{timestamp}.txt"
        ref.write_text(f"Prompt: {prompt}\nURL: {url}\n")
        return f"IMAGE_URL:{url}"
    except Exception as e:
        return f"Image generation failed: {e}"


def search_youtube(query: str) -> str:
    encoded = query.replace(" ", "+")
    url = f"https://www.youtube.com/results?search_query={encoded}"
    webbrowser.open(url)
    return f"Opened YouTube search for: **{query}**"
