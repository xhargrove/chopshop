"use client";

import { useEffect, type KeyboardEvent as ReactKeyboardEvent } from "react";

export type ShortcutAction =
  | "togglePlayback"
  | "setIntroIn"
  | "setIntroOut"
  | "setOutroIn"
  | "setOutroOut"
  | "toggleLoop"
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
  | "jumpToCue8";

export type ShortcutMap = Record<string, ShortcutAction>;

export type ShortcutHandlers = Record<ShortcutAction, () => void>;

export const shortcutMap: ShortcutMap = {
  Space: "togglePlayback",
  KeyI: "setIntroIn",
  KeyO: "setIntroOut",
  BracketLeft: "setOutroIn",
  BracketRight: "setOutroOut",
  KeyL: "toggleLoop",
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
      const shortcutAction = shortcutMap[getShortcutKey(event)];

      if (!shortcutAction || isEditableTarget(event.target)) {
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
