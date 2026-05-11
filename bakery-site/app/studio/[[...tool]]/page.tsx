import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export const dynamic = "force-dynamic";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

export default function StudioPage() {
  if (!projectId || projectId === "your_project_id_here") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 p-8">
        <div className="bg-white rounded-2xl border border-pink-200 p-10 max-w-lg text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <h1 className="font-serif text-2xl text-plum mb-4">
            Studio not connected yet
          </h1>
          <p className="text-plum/60 text-sm leading-relaxed mb-6">
            To activate the dashboard, add your Sanity project ID to{" "}
            <code className="bg-pink-50 px-1.5 py-0.5 rounded text-pink-600">
              .env.local
            </code>
            :
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left text-xs font-mono text-gray-600 mb-6">
            <p>NEXT_PUBLIC_SANITY_PROJECT_ID=your_id_here</p>
            <p>NEXT_PUBLIC_SANITY_DATASET=production</p>
          </div>
          <p className="text-xs text-plum/40">
            Get your project ID at{" "}
            <a href="https://sanity.io/manage" className="underline text-sky-500">
              sanity.io/manage
            </a>
          </p>
        </div>
      </div>
    );
  }

  return <NextStudio config={config} />;
}
