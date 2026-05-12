import { Button } from "@/components/ui/Button";
import type { ProjectLinks } from "@/content/projects.types";

/** The "go use it" actions on a project page. Each button renders only if its link exists. */
export function ActionButtons({ links }: { links: ProjectLinks }) {
  return (
    <div className="flex flex-wrap gap-3">
      {links.app && (
        <Button href={links.app} external>
          App
        </Button>
      )}
      {links.live && (
        <Button href={links.live} external variant={links.app ? "secondary" : "primary"}>
          {links.app ? "Marketing site" : "App Site"}
        </Button>
      )}
      {links.demo && (
        <Button href={links.demo} external variant="secondary">
          Try interactive demo
        </Button>
      )}
      {links.appStore && (
        <Button href={links.appStore} external variant="secondary">
          App Store
        </Button>
      )}
      {links.source && (
        <Button href={links.source} external variant="ghost">
          View source
        </Button>
      )}
    </div>
  );
}
