"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { CONTEXT_MENU_OFFSET_PX } from "@/lib/constants";

interface ContextMenuItem {
  label: string;
  onSelect: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onDismiss: () => void;
}

export function ContextMenu({ x, y, items, onDismiss }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const menu = menuRef.current;
    if (menu) {
      menu.style.left = `${x + CONTEXT_MENU_OFFSET_PX}px`;
      menu.style.top = `${y + CONTEXT_MENU_OFFSET_PX}px`;
    }

    const firstButton = menu?.querySelector("button");
    firstButton?.focus();

    const handlePointerDown = (event: PointerEvent): void => {
      if (menu && !menu.contains(event.target instanceof Node ? event.target : null)) {
        onDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
        return;
      }

      if (event.key === "Tab" && menu) {
        const buttons = Array.from(menu.querySelectorAll("button"));
        const first = buttons[0];
        const last = buttons[buttons.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }

        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDismiss, x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-36 rounded-dropzone border border-border bg-surface p-1 shadow-2xl"
      role="menu"
      aria-label="Cue point actions"
    >
      {items.map((item): ReactNode => (
        <button
          key={item.label}
          type="button"
          className="block w-full rounded px-3 py-2 text-left font-body text-sm text-text-primary hover:bg-background focus:bg-background focus:outline-none"
          role="menuitem"
          onClick={() => {
            item.onSelect();
            onDismiss();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
