import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { projects } from "@/content/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now },
    ...projects.map((p) => ({ url: `${site.url}/work/${p.slug}`, lastModified: now })),
  ];
}
