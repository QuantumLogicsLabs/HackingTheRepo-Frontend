import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ShortcutsHelpModal from "../components/ShortcutsHelpModal";

describe("ShortcutsHelpModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ShortcutsHelpModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the shortcut list when open", () => {
    render(<ShortcutsHelpModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Open the New Job page")).toBeInTheDocument();
    expect(screen.getByText("Go to the Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText("Toggle this shortcuts cheatsheet"),
    ).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<ShortcutsHelpModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Close shortcuts help"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<ShortcutsHelpModal isOpen onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<ShortcutsHelpModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByTestId("shortcuts-modal-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the dialog", () => {
    const onClose = vi.fn();
    render(<ShortcutsHelpModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });
});
