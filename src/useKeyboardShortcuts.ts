import { useEffect, useRef } from "react";
export interface ShortcutHandlers {
  [key: string]: () => void;
}

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableElement(el: HTMLElement): boolean {
  if (EDITABLE_TAGS.has(el.tagName)) return true;
  return el.contentEditable === "true";
}

function isTypingTarget(target: EventTarget | null): boolean {
  let el = target as HTMLElement | null;
  while (el) {
    if (isEditableElement(el)) return true;
    el = el.parentElement;
  }
  return false;
}

export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  enabled = true,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const map = handlersRef.current;
      const handler = map[event.key] ?? map[event.key.toLowerCase()];

      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
