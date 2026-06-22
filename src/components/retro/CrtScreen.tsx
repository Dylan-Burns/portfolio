"use client";

import type { FileItem } from "@/content/file-items";
import type { ReactNode } from "react";

export function CrtScreen({
  items, selected, onHover, renderItem,
}: {
  items: FileItem[];
  selected: number;
  onHover: (i: number) => void;
  renderItem: (item: FileItem, i: number, selected: boolean) => ReactNode; // parent wraps in TransitionLink
}) {
  return (
    <div className="crt-term relative font-[family-name:var(--font-mono)]" style={{ width: 600 }}>
      <div className="flex border-b border-[rgba(100,240,160,.18)] pb-[14px] text-[13px] text-[#3f8f5e]">
        <span>burnsOS v1.0 — work.ts</span><span className="ml-auto">READY</span>
      </div>
      <div className="flex pt-4 text-[15px]">
        <div className="min-w-[42px] border-r border-[rgba(100,240,160,.14)] text-right text-[#2c6b45]">
          {Array.from({ length: items.length + 2 }, (_, i) => <div key={i} className="px-3 leading-[2]">{i + 1}</div>)}
        </div>
        <div className="flex-1 px-4 leading-[2]">
          <div className="text-[#3f8f5e]">&gt; ls ./work</div>
          <div className="mt-3">
            {items.map((it, i) => (
              <div key={it.href} onMouseEnter={() => onHover(i)}>
                {renderItem(it, i, i === selected)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
