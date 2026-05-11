import { defineField, defineType } from "sanity";

export default defineType({
  name: "galleryPost", title: "Gallery Photos", type: "document",
  fields: [
    defineField({ name: "image", title: "Photo", type: "image", options: { hotspot: true }, validation: (R) => R.required() }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
    defineField({ name: "instagramUrl", title: "Instagram Post Link", type: "url" }),
    defineField({ name: "order", title: "Display Order", type: "number" }),
  ],
  orderings: [{ title: "Display Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "caption", media: "image" }, prepare({ title, media }: any) { return { title: title || "Untitled photo", media }; } },
});
