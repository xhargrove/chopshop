"use client";

import { EDITOR_TABS } from "@/lib/constants";
import type { EditorTabId } from "@/types/audio";

const TAB_LABELS: Record<EditorTabId, string> = {
  prepare: "Prepare",
  edit: "Edit",
  clean: "Clean",
  swap: "Swap",
  transition: "Transition",
  history: "History",
};

interface EditorTabsProps {
  activeTab: EditorTabId;
  onTabChange: (tab: EditorTabId) => void;
}

export function EditorTabs({ activeTab, onTabChange }: EditorTabsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Editor sections">
      {EDITOR_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          className={`rounded-dropzone border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] ${
            activeTab === tab ? "border-accent text-accent" : "border-border text-text-muted"
          }`}
          onClick={() => onTabChange(tab)}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
