import { defineField, defineType } from "sanity";

export default defineType({
  name: "about", title: "About Jenny", type: "document",
  fields: [
    defineField({ name: "photo", title: "Photo of Jenny", type: "image", options: { hotspot: true } }),
    defineField({ name: "paragraphs", title: "Story Paragraphs", type: "array", of: [{ type: "text", rows: 4 }] }),
    defineField({ name: "signature", title: "Sign-off name", type: "string", initialValue: "Jenny" }),
  ],
  preview: { prepare: () => ({ title: "About Jenny" }) },
});
