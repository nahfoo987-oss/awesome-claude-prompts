import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;

export default defineConfig({
  name: "jenny-sugar-shack",
  title: "Jenny's Sugar Shack",
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Jenny's Sugar Shack")
          .items([
            S.listItem()
              .title("⚙️  Site Settings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.listItem()
              .title("🧁  About Jenny")
              .child(S.document().schemaType("about").documentId("about")),
            S.divider(),
            S.documentTypeListItem("galleryPost").title("📸  Gallery Photos"),
            S.documentTypeListItem("merch").title("🛍️  Merchandise"),
            S.documentTypeListItem("review").title("⭐  Reviews"),
          ]),
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
  basePath: "/studio",
});
