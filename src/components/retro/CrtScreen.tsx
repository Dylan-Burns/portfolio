"use client";

import type { ReactNode } from "react";

/**
 * Green CRT terminal: a title bar (`> ls <path>`), a blank line, then line-numbered rows.
 * Each row is one flex line (number cell + content cell sharing the same line-height) so the
 * gutter numbers always line up with their content. Generic over the row item type so it can
 * render project links, folders, games, or a `../` entry — the parent supplies `renderItem`.
 */
export function CrtScreen<T>({
  items,
  selected,
  onHover,
  renderItem,
  path = "./work",
  width = 387,
}: {
  items: T[];
  selected: number;
  onHover: (i: number) => void;
  renderItem: (item: T, i: number, selected: boolean) => ReactNode;
  path?: string;
  // authored terminal width the parent scales to fit the glass; narrower on mobile (comment column
  // hidden) so the filenames fill the screen instead of leaving dead space on the right
  width?: number;
}) {
  const lines: { node: ReactNode; itemIndex: number }[] = [
    { node: <span className="text-[#3f8f5e]">&gt; ls {path}</span>, itemIndex: -1 },
    { node: <span>&nbsp;</span>, itemIndex: -1 },
    ...items.map((it, i) => ({ node: renderItem(it, i, i === selected), itemIndex: i })),
  ];

  return (
    <div className="crt-term relative" style={{ width }}>
      <div className="pt-4 text-[15px]">
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex leading-loose"
            onMouseEnter={line.itemIndex >= 0 ? () => onHover(line.itemIndex) : undefined}
          >
            <div className="w-[42px] shrink-0 border-r border-[rgba(100,240,160,.14)] px-3 text-right text-[#2c6b45]">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1 px-4">{line.node}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
