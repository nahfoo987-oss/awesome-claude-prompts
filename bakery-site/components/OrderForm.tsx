"use client";

import { useForm, ValidationError } from "@formspree/react";

export default function OrderForm() {
  const [state, handleSubmit] = useForm("xgodpkag");

  if (state.succeeded) {
    return (
      <div className="bg-blush rounded-2xl p-10 text-center">
        <p className="font-serif text-2xl text-plum mb-3">Request received!</p>
        <p className="text-plum/60 leading-relaxed">Thank you! I&apos;ll be in touch within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-pink-200 p-8 flex flex-col gap-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-plum/60 uppercase">Your Name <span className="text-pink-500">*</span></label>
          <input name="name" required placeholder="Sarah Johnson" className="input-field" />
          <ValidationError field="name" errors={state.errors} className="text-xs text-pink-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-plum/60 uppercase">Phone or Email <span className="text-pink-500">*</span></label>
          <input name="contact" required placeholder="sarah@email.com" className="input-field" />
          <ValidationError field="contact" errors={state.errors} className="text-xs text-pink-500" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-plum/60 uppercase">Event Type</label>
          <select name="event_type" className="input-field">
            <option value="">Select one</option>
            <option>Birthday</option><option>Wedding</option><option>Baby shower</option>
            <option>Anniversary</option><option>Corporate / Office</option>
            <option>Just because</option><option>Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-plum/60 uppercase">Date Needed <span className="text-pink-500">*</span></label>
          <input name="event_date" type="date" required className="input-field" />
          <ValidationError field="event_date" errors={state.errors} className="text-xs text-pink-500" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-plum/60 uppercase">Size</label>
          <select name="size" className="input-field">
            <option value="">Select size</option>
            <option>Small — 6 inch (serves 8–10)</option>
            <option>Medium — 8 inch (serves 14–18)</option>
            <option>Large — 10 inch (serves 24–30)</option>
            <option>Tiered — custom</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-plum/60 uppercase">Flavor</label>
          <select name="flavor" className="input-field">
            <option value="">Select flavor</option>
            <option>Vanilla bean</option><option>Chocolate fudge</option>
            <option>Lemon blueberry</option><option>Strawberry cream</option>
            <option>Red velvet</option><option>Carrot with cream cheese</option>
            <option>Not sure — help me choose</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-wide text-plum/60 uppercase">Design Ideas</label>
        <textarea name="design" rows={4} placeholder="Colors, theme, message, inspo photos..." className="input-field resize-none" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-plum/60 uppercase">Budget</label>
          <select name="budget" className="input-field">
            <option value="">Prefer not to say</option>
            <option>Under $75</option><option>$75 – $150</option>
            <option>$150 – $300</option><option>$300+</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-wide text-plum/60 uppercase">Anything else?</label>
          <textarea name="notes" rows={2} placeholder="Allergies, delivery, special requests..." className="input-field resize-none" />
        </div>
      </div>
      <ValidationError errors={state.errors} className="text-sm text-pink-500 text-center" />
      <button type="submit" disabled={state.submitting} className="btn-primary self-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
        {state.submitting ? "Sending…" : "Submit Order Request"}
      </button>
      <p className="text-xs text-center text-plum/40">No payment collected here — just starting the conversation.</p>
    </form>
  );
}
