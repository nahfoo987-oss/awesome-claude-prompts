"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "sending" | "success" | "error";

export default function OrderForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      // Replace YOUR_FORM_ID with your actual Formspree form ID.
      // Sign up free at https://formspree.io — takes 2 minutes.
      const res = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-rose-blush/40 rounded-2xl p-10 text-center">
        <p className="font-serif text-2xl text-warm-brown mb-3">
          Request received!
        </p>
        <p className="text-warm-brown/60 leading-relaxed">
          Thank you for reaching out. I&apos;ll be in touch within 24 hours to
          chat through the details.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-rose-blush/60 p-8 flex flex-col gap-5"
    >
      {/* Contact */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-warm-brown/60 uppercase">
            Your Name <span className="text-rose-deep">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="Sarah Johnson"
            className="input-field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-warm-brown/60 uppercase">
            Phone or Email <span className="text-rose-deep">*</span>
          </label>
          <input
            name="contact"
            required
            placeholder="sarah@email.com or 555-0100"
            className="input-field"
          />
        </div>
      </div>

      {/* Event */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-warm-brown/60 uppercase">
            Event Type
          </label>
          <select name="event_type" className="input-field">
            <option value="">Select one</option>
            <option>Birthday</option>
            <option>Wedding</option>
            <option>Baby shower</option>
            <option>Anniversary</option>
            <option>Corporate / Office</option>
            <option>Just because</option>
            <option>Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-warm-brown/60 uppercase">
            Date Needed <span className="text-rose-deep">*</span>
          </label>
          <input
            name="event_date"
            type="date"
            required
            className="input-field"
          />
        </div>
      </div>

      {/* Cake details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-warm-brown/60 uppercase">
            Cake Size
          </label>
          <select name="size" className="input-field">
            <option value="">Select size</option>
            <option>Small — 6 inch (serves 8–10)</option>
            <option>Medium — 8 inch (serves 14–18)</option>
            <option>Large — 10 inch (serves 24–30)</option>
            <option>Tiered — custom (contact me)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-warm-brown/60 uppercase">
            Flavor
          </label>
          <select name="flavor" className="input-field">
            <option value="">Select flavor</option>
            <option>Vanilla bean</option>
            <option>Chocolate fudge</option>
            <option>Lemon blueberry</option>
            <option>Strawberry cream</option>
            <option>Red velvet</option>
            <option>Carrot with cream cheese</option>
            <option>Not sure — help me choose</option>
          </select>
        </div>
      </div>

      {/* Design description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-wide text-warm-brown/60 uppercase">
          Design Ideas
        </label>
        <textarea
          name="design"
          rows={4}
          placeholder="Describe the look you have in mind — colors, theme, message, flowers, minimalist, maximalist... anything helps. Photos welcome once we're in touch."
          className="input-field resize-none"
        />
      </div>

      {/* Budget */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-wide text-warm-brown/60 uppercase">
          Approximate Budget
        </label>
        <select name="budget" className="input-field">
          <option value="">Prefer not to say</option>
          <option>Under $75</option>
          <option>$75 – $150</option>
          <option>$150 – $300</option>
          <option>$300+</option>
        </select>
      </div>

      {/* Anything else */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-wide text-warm-brown/60 uppercase">
          Anything else?
        </label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Allergies, dietary needs, delivery vs. pickup, or anything else I should know."
          className="input-field resize-none"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-rose-deep text-center">
          Something went wrong. Please email us directly at
          hello@jennysugarshack.com.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary self-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Sending…" : "Submit Order Request"}
      </button>

      <p className="text-xs text-center text-warm-brown/40">
        No payment is collected here — this is just to start the conversation.
      </p>
    </form>
  );
}
