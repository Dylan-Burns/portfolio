"use client";

import type { FileItem } from "@/content/file-items";
import type { ReactNode } from "react";

/**
 * Green CRT terminal: a title bar, then line-numbered rows. Each row is one flex line
 * (number cell + content cell sharing the same line-height) so the gutter numbers always
 * line up with their content. Lines: `> ls ./work`, a blank line, then one file per item.
 */
export function CrtScreen({
  items, selected, onHover, renderItem,
}: {
  items: FileItem[];
  selected: number;
  onHover: (i: number) => void;
  renderItem: (item: FileItem, i: number, selected: boolean) => ReactNode; // parent wraps in TransitionLink
}) {
  const lines: { node: ReactNode; fileIndex: number }[] = [
    { node: <span className="text-[#3f8f5e]">&gt; ls ./work</span>, fileIndex: -1 },
    { node: <span>&nbsp;</span>, fileIndex: -1 },
    ...items.map((it, i) => ({ node: renderItem(it, i, i === selected), fileIndex: i })),
  ];

  return (
    <div className="crt-term relative" style={{ width: 580 }}>
      <div className="pt-4 text-[15px]">
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex leading-loose"
            onMouseEnter={line.fileIndex >= 0 ? () => onHover(line.fileIndex) : undefined}
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
