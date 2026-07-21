import { countWords, createNote, deriveTitle, duplicateNote, filterNotes, notePreview, sortNotes } from "./notes";
import type { Note } from "./types";

const notes: Note[] = [
  { id: "1", title: "Grocery list", body: "Milk and bread", updatedAt: "2026-01-01T10:00:00Z" },
  { id: "2", title: "Trip", body: "Train to Kyoto", updatedAt: "2026-01-02T10:00:00Z" },
];

describe("note utilities", () => {
  it("creates an empty note with a stable timestamp", () => {
    const now = new Date("2026-04-05T12:00:00Z");
    const note = createNote(now);
    expect(note).toMatchObject({ title: "Untitled note", body: "", updatedAt: now.toISOString() });
    expect(note.id).toMatch(new RegExp(`^${now.getTime()}-`));
  });

  it("derives a title from title, body, or fallback", () => {
    expect(deriveTitle(notes[0])).toBe("Grocery list");
    expect(deriveTitle({ title: " ", body: "\n First thought" })).toBe("First thought");
    expect(deriveTitle({ title: "", body: "" })).toBe("Untitled note");
  });

  it("filters case-insensitively across titles and bodies", () => {
    expect(filterNotes(notes, "GROCERY").map(({ id }) => id)).toEqual(["1"]);
    expect(filterNotes(notes, "kyoto").map(({ id }) => id)).toEqual(["2"]);
    expect(filterNotes(notes, "missing")).toHaveLength(0);
  });

  it("builds previews and counts words", () => {
    expect(notePreview("  one\n\n two  ")).toBe("one two");
    expect(notePreview("")).toBe("No additional text");
    expect(notePreview("abcdefgh", 5)).toBe("abcde…");
    expect(countWords("Don’t forget the café — at 5pm.")).toBe(6);
  });

  it("sorts without mutation and duplicates content", () => {
    expect(sortNotes(notes).map(({ id }) => id)).toEqual(["2", "1"]);
    expect(notes.map(({ id }) => id)).toEqual(["1", "2"]);
    const copy = duplicateNote(notes[0], new Date("2026-04-05T12:00:00Z"));
    expect(copy).toMatchObject({ title: "Grocery list copy", body: notes[0].body });
    expect(copy.id).not.toBe(notes[0].id);
  });
});
