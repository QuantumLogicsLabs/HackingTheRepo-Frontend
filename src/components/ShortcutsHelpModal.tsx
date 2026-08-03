import { useEffect, useRef, type ReactElement } from "react";
import "./ShortcutsHelpModal.css";

interface ShortcutItem {
  keys: string;
  description: string;
}

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: "N", description: "Open the New Job page" },
  { keys: "D", description: "Go to the Dashboard" },
  { keys: "?", description: "Toggle this shortcuts cheatsheet" },
];

export default function ShortcutsHelpModal({
  isOpen,
  onClose,
}: ShortcutsHelpModalProps): ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="shortcuts-modal-backdrop"
      onClick={onClose}
      data-testid="shortcuts-modal-backdrop"
    >
      <div
        className="shortcuts-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shortcuts-modal__header">
          <h2 id="shortcuts-modal-title">Keyboard Shortcuts</h2>
          <button
            type="button"
            className="shortcuts-modal__close"
            onClick={onClose}
            aria-label="Close shortcuts help"
          >
            ×
          </button>
        </div>

        <ul className="shortcuts-modal__list">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.keys} className="shortcuts-modal__item">
              <kbd className="shortcuts-modal__key">{shortcut.keys}</kbd>
              <span className="shortcuts-modal__desc">
                {shortcut.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
