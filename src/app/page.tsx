import { RetroComputer } from "@/components/retro/RetroComputer";
import { toFileItems } from "@/content/file-items";
import { projects } from "@/content/projects";

export default function HomePage() {
  return <RetroComputer items={toFileItems(projects)} />;
}
