import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("Paper desktop app", () => {
  beforeEach(() => localStorage.clear());

  it("uses Tony Notes as the application title", () => {
    render(<App />);
    expect(document.title).toBe("Tony Notes");
  });

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

  it("displays the adaptive SVG logo before the Tony Notes heading", () => {
    render(<App />);
    const logo = screen.getByRole("img", { name: "Tony Notes logo" });
    const heading = screen.getByRole("heading", { name: "Tony Notes" });
    expect(logo.tagName).toBe("svg");
    expect(logo.querySelector(".logo-background")).toBeInTheDocument();
    expect(logo.querySelector(".logo-monogram")).toBeInTheDocument();
    expect(logo.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("edits Markdown and renders a GitHub-flavored preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "Note content" }), {
      target: { value: "## Release checklist\n\n- [x] **Build** desktop app\n- [ ] Ship it" },
    });
    await user.click(screen.getByRole("button", { name: "Preview" }));

    const preview = screen.getByLabelText("Markdown preview");
    expect(preview).toContainElement(screen.getByRole("heading", { name: "Release checklist" }));
    expect(screen.getByText("Build").tagName).toBe("STRONG");
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect((screen.getByRole("textbox", { name: "Note content" }) as HTMLTextAreaElement).value).toContain("## Release checklist");
  });
});
