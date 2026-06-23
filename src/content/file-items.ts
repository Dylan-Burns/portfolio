import type { Project } from "./projects.types";

export type FileItem = {
  name: string;     // e.g. "Parahealth" (destination/H1 label)
  label: string;    // e.g. "parahealth.tsx" (filename shown on the CRT)
  comment: string;  // e.g. "healthcare" (trailing // comment)
  href: string;     // e.g. "/work/parahealth"
};

/** Slugs whose CRT line item links straight to an external site instead of /work/<slug>. */
const EXTERNAL_HREFS: Record<string, string> = {};

/** Override the filename shown on the CRT for an internal project (default is `<slug>.tsx`). */
const LABEL_OVERRIDES: Record<string, string> = {
  parahealth: "parahealth.ai",
  claruss: "claruss.app",
  cartlords: "cartlords.com",
};

/** Build a CRT line item that links straight to an external site (label = its domain). */
const externalItem = (name: string, href: string, comment: string): FileItem => ({
  name,
  label: href.replace(/^https?:\/\//, ""),
  comment,
  href,
});

/** Standalone external links (not backed by a /work project), inserted after `afterSlug`. */
const STANDALONE_EXTERNAL: { afterSlug: string; item: FileItem }[] = [
  // hidden for now
  // { afterSlug: "claruss", item: externalItem("Parkli", "https://parkli.io", "ios") },
];

/** Maps projects (+ resume) to the files shown on the CRT, in display order. */
export function toFileItems(projects: Project[]): FileItem[] {
  // short trailing-comment tag: first segment of the category (split on · , /)
  const shortTag = (category: string) => category.split(/[·,/]/)[0].trim().toLowerCase();
  const projectFiles: FileItem[] = [];
  for (const p of projects) {
    const external = EXTERNAL_HREFS[p.slug];
    // external items show their domain (parahealth.ai); internal ones show the source filename
    projectFiles.push(
      external
        ? externalItem(p.name, external, shortTag(p.category))
        : { name: p.name, label: LABEL_OVERRIDES[p.slug] ?? `${p.slug}.tsx`, comment: shortTag(p.category), href: `/work/${p.slug}` },
    );
    // drop in any standalone external links that sit after this project
    for (const s of STANDALONE_EXTERNAL) if (s.afterSlug === p.slug) projectFiles.push(s.item);
  }
  const resume: FileItem = { name: "Résumé", label: "resume.pdf", comment: "doc", href: "/resume" };
  return [...projectFiles, resume];
}
