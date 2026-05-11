import { defineField, defineType } from "sanity";

export default defineType({
  name: "merch",
  title: "Merchandise",
  type: "document",
  icon: () => "🛍️",
  fields: [
    defineField({
      name: "name",
      title: "Product Name",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "description",
      title: "Short Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "price",
      title: "Price (e.g. $28)",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "image",
      title: "Product Photo",
      type: "image",
      description: "Upload a photo of this item",
      options: { hotspot: true },
      validation: (R) => R.required(),
    }),
    defineField({
      name: "available",
      title: "Available / In Stock",
      type: "boolean",
      initialValue: true,
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
    select: { title: "name", subtitle: "price", media: "image" },
  },
});
