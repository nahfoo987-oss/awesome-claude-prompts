import { defineField, defineType } from "sanity";

export default defineType({
  name: "galleryPost",
  title: "Gallery Photos",
  type: "document",
  icon: () => "📸",
  fields: [
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      description: "Upload directly from Jenny's phone or saved Instagram photos",
      options: { hotspot: true },
      validation: (R) => R.required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram Post Link (optional)",
      type: "url",
      description: "If this photo is from Instagram, paste the post link here",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower numbers appear first",
    }),
  ],
  orderings: [{ title: "Display Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "caption", media: "image" },
    prepare({ title, media }) {
      return { title: title || "Untitled photo", media };
    },
  },
});
