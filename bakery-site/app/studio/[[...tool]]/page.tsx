import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

// Jenny's dashboard — accessible at /studio
// Protected by Sanity's own login (she signs in with her email)
export default function StudioPage() {
  return <NextStudio config={config} />;
}
