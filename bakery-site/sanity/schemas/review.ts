import { defineField, defineType } from "sanity";

export default defineType({
  name: "review",
  title: "Reviews",
  type: "document",
  icon: () => "⭐",
  fields: [
    defineField({
      name: "platform",
      title: "Platform",
      type: "string",
      options: {
        list: [
          { title: "Yelp", value: "yelp" },
          { title: "Instagram", value: "instagram" },
          { title: "Facebook", value: "facebook" },
          { title: "Google", value: "google" },
        ],
        layout: "radio",
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: "reviewerName",
      title: "Reviewer Name or Handle",
      type: "string",
      description: "Full name for Yelp/Facebook, @handle for Instagram",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "stars",
      title: "Star Rating (Yelp/Facebook/Google only)",
      type: "number",
      options: {
        list: [5, 4, 3, 2, 1],
        layout: "radio",
      },
    }),
    defineField({
      name: "text",
      title: "Review Text",
      type: "text",
      rows: 4,
      validation: (R) => R.required(),
    }),
    defineField({
      name: "date",
      title: "Review Date",
      type: "date",
    }),
    defineField({
      name: "featured",
      title: "Show on homepage",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "reviewerName", subtitle: "platform" },
  },
});
