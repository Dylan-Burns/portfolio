import { RetroComputer } from "@/components/retro/RetroComputer";
import { toFileItems } from "@/content/file-items";
import { projects } from "@/content/projects";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  // arriving from a work page's "← home" link (/?view=files) lands straight in the zoomed file list,
  // skipping the intro typewriter
  const { view } = await searchParams;
  return <RetroComputer items={toFileItems(projects)} initialZoom={view === "files"} />;
}
