import { defineField, defineType } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  icon: () => "⚙️",
  fields: [
    defineField({
      name: "businessName",
      title: "Business Name",
      type: "string",
      initialValue: "Jenny's Sugar Shack",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      description: "Short line under the hero headline",
    }),
    defineField({
      name: "email",
      title: "Contact Email",
      type: "string",
    }),
    defineField({
      name: "instagramHandle",
      title: "Instagram Handle",
      type: "string",
      description: "Without the @ symbol",
      initialValue: "jennysugarshack",
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook Page URL",
      type: "url",
    }),
  ],
  preview: { select: { title: "businessName" } },
});
