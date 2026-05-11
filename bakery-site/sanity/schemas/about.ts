import { defineField, defineType } from "sanity";

export default defineType({
  name: "about",
  title: "About Jenny",
  type: "document",
  icon: () => "🧁",
  fields: [
    defineField({
      name: "photo",
      title: "Photo of Jenny",
      type: "image",
      description: "Upload a photo of Jenny — this shows in the About section",
      options: { hotspot: true },
    }),
    defineField({
      name: "paragraphs",
      title: "Story Paragraphs",
      type: "array",
      description: "Add 2–3 short paragraphs about Jenny's story",
      of: [{ type: "text", rows: 4 }],
    }),
    defineField({
      name: "signature",
      title: "Sign-off name",
      type: "string",
      initialValue: "Jenny",
    }),
  ],
  preview: { prepare: () => ({ title: "About Jenny" }) },
});
