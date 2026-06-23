import type { Project } from "./projects.types";

export type FileItem = {
  name: string;     // e.g. "Parahealth" (destination/H1 label)
  label: string;    // e.g. "parahealth.tsx" (filename shown on the CRT)
  comment: string;  // e.g. "healthcare" (trailing // comment)
  href: string;     // e.g. "/work/parahealth"
};

/** Maps projects (+ resume) to the files shown on the CRT, in display order. */
export function toFileItems(projects: Project[]): FileItem[] {
  // short trailing-comment tag: first segment of the category (split on · , /)
  const shortTag = (category: string) => category.split(/[·,/]/)[0].trim().toLowerCase();
  const projectFiles: FileItem[] = projects.map((p) => ({
    name: p.name,
    label: `${p.slug}.tsx`,
    comment: shortTag(p.category),
    href: `/work/${p.slug}`,
  }));
  const resume: FileItem = { name: "Résumé", label: "resume.pdf", comment: "doc", href: "/resume" };
  return [...projectFiles, resume];
}
