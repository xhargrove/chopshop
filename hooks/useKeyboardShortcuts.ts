"use client";

import { useEffect, type KeyboardEvent as ReactKeyboardEvent } from "react";

export type ShortcutAction =
  | "togglePlayback"
  | "setIntroIn"
  | "setIntroOut"
  | "setOutroIn"
  | "setOutroOut"
  | "toggleLoop"
  | "setLoopIn"
  | "setLoopOut"
  | "nudgeBackwardSmall"
  | "nudgeForwardSmall"
  | "nudgeBackwardLarge"
  | "nudgeForwardLarge"
  | "clearSelection"
  | "jumpToCue1"
  | "jumpToCue2"
  | "jumpToCue3"
  | "jumpToCue4"
  | "jumpToCue5"
  | "jumpToCue6"
  | "jumpToCue7"
  | "jumpToCue8"
  | "setCue1"
  | "setCue2"
  | "setCue3"
  | "setCue4"
  | "setCue5"
  | "setCue6"
  | "setCue7"
  | "setCue8";

export type ShortcutMap = Record<string, ShortcutAction>;

export interface ShortcutHandlers extends Record<ShortcutAction, () => void> {
  undo?: () => void;
  redo?: () => void;
}

export const shortcutMap: ShortcutMap = {
  Space: "togglePlayback",
  KeyI: "setIntroIn",
  KeyO: "setIntroOut",
  BracketLeft: "setOutroIn",
  BracketRight: "setOutroOut",
  KeyL: "toggleLoop",
  "Shift+KeyI": "setLoopIn",
  "Shift+KeyO": "setLoopOut",
  ArrowLeft: "nudgeBackwardSmall",
  ArrowRight: "nudgeForwardSmall",
  "Shift+ArrowLeft": "nudgeBackwardLarge",
  "Shift+ArrowRight": "nudgeForwardLarge",
  Escape: "clearSelection",
  Digit1: "jumpToCue1",
  Digit2: "jumpToCue2",
  Digit3: "jumpToCue3",
  Digit4: "jumpToCue4",
  Digit5: "jumpToCue5",
  Digit6: "jumpToCue6",
  Digit7: "jumpToCue7",
  Digit8: "jumpToCue8",
  "Shift+Digit1": "setCue1",
  "Shift+Digit2": "setCue2",
  "Shift+Digit3": "setCue3",
  "Shift+Digit4": "setCue4",
  "Shift+Digit5": "setCue5",
  "Shift+Digit6": "setCue6",
  "Shift+Digit7": "setCue7",
  "Shift+Digit8": "setCue8",
};

const editableSelector = "input, textarea, [contenteditable='true']";

const isEditableTarget = (target: EventTarget | null): boolean => target instanceof HTMLElement && target.closest(editableSelector) !== null;

const getShortcutKey = (event: KeyboardEvent | ReactKeyboardEvent): string => (event.shiftKey ? `Shift+${event.code}` : event.code);

export function useKeyboardShortcuts(handlers: ShortcutHandlers, isEnabled: boolean = true): void {
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.code === "KeyZ") {
        event.preventDefault();

        if (event.shiftKey) {
          handlers.redo?.();
        } else {
          handlers.undo?.();
        }

        return;
      }

      const shortcutAction = shortcutMap[getShortcutKey(event)];

      if (!shortcutAction) {
        return;
      }

      event.preventDefault();
      handlers[shortcutAction]();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlers, isEnabled]);
}
