import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "../useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the matching handler on keydown", () => {
    const onN = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: onN }));

    fireEvent.keyDown(window, { key: "n" });

    expect(onN).toHaveBeenCalledTimes(1);
  });

  it("is case-insensitive for letter shortcuts", () => {
    const onD = vi.fn();
    renderHook(() => useKeyboardShortcuts({ d: onD }));

    fireEvent.keyDown(window, { key: "D" });

    expect(onD).toHaveBeenCalledTimes(1);
  });

  it("toggles help with '?'", () => {
    const onHelp = vi.fn();
    renderHook(() => useKeyboardShortcuts({ "?": onHelp }));

    fireEvent.keyDown(window, { key: "?" });

    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it("does not fire while typing in an input", () => {
    const onN = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: onN }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: "n" });

    expect(onN).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("does not fire while typing in a textarea", () => {
    const onD = vi.fn();
    renderHook(() => useKeyboardShortcuts({ d: onD }));

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    fireEvent.keyDown(textarea, { key: "d" });

    expect(onD).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it("does not fire while typing in a select", () => {
    const onN = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: onN }));

    const select = document.createElement("select");
    document.body.appendChild(select);
    select.focus();

    fireEvent.keyDown(select, { key: "n" });

    expect(onN).not.toHaveBeenCalled();
    document.body.removeChild(select);
  });

  it("does not fire while typing in a contentEditable element", () => {
    const onN = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: onN }));

    const div = document.createElement("div");
    div.contentEditable = "true";
    document.body.appendChild(div);
    div.focus();

    fireEvent.keyDown(div, { key: "n" });

    expect(onN).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it("ignores shortcuts when a modifier key is held", () => {
    const onN = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: onN }));

    fireEvent.keyDown(window, { key: "n", ctrlKey: true });
    fireEvent.keyDown(window, { key: "n", metaKey: true });
    fireEvent.keyDown(window, { key: "n", altKey: true });

    expect(onN).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const onN = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: onN }, false));

    fireEvent.keyDown(window, { key: "n" });

    expect(onN).not.toHaveBeenCalled();
  });
});
