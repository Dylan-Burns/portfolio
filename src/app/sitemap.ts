import type { MetadataRoute } from "next";
import { site } from "@/content/site";

// The whole site is the one page; the old /work pages redirect to it.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: site.url, lastModified: new Date() }];
}
