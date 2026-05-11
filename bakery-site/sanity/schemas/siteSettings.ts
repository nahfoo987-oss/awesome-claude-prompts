import { defineField, defineType } from "sanity";

export default defineType({
  name: "siteSettings", title: "Site Settings", type: "document",
  fields: [
    defineField({ name: "businessName", title: "Business Name", type: "string", initialValue: "Jenny's Sugar Shack" }),
    defineField({ name: "tagline", title: "Tagline", type: "string" }),
    defineField({ name: "email", title: "Contact Email", type: "string" }),
    defineField({ name: "instagramHandle", title: "Instagram Handle", type: "string", initialValue: "jennysugarshack" }),
    defineField({ name: "facebookUrl", title: "Facebook Page URL", type: "url" }),
  ],
  preview: { select: { title: "businessName" } },
});
