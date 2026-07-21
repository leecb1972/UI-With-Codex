import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("Paper desktop app", () => {
  beforeEach(() => localStorage.clear());

  it("creates, edits, searches, duplicates, and deletes notes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New note" }));
    const title = screen.getByRole("textbox", { name: "Note title" });
    fireEvent.change(title, { target: { value: "Desktop plan" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Note content" }), { target: { value: "Ship the macOS application" } });
    expect(screen.getByText("6 words")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Desktop plan" } });
    expect(screen.getByRole("button", { name: "Open Desktop plan" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(screen.getByRole("textbox", { name: "Note title" })).toHaveValue("Desktop plan copy");
    await user.click(screen.getByRole("button", { name: "Delete note" }));
    expect(screen.getByRole("textbox", { name: "Note title" })).toHaveValue("Desktop plan");
  });

  it("toggles and persists the deep color scheme", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Switch to deep color scheme" }));
    expect(document.documentElement).toHaveAttribute("data-depth", "deep");
    expect(localStorage.getItem("paper-color-depth")).toBe("deep");
    expect(screen.getByRole("button", { name: "Switch to shallow color scheme" })).toHaveAttribute("aria-pressed", "true");
  });
});
