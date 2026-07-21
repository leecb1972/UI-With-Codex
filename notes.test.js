import test from "node:test";
import assert from "node:assert/strict";
import { countWords, createNote, deriveTitle, duplicateNote, filterNotes, notePreview, sortNotes } from "./notes.js";

const notes = [
  { id: "1", title: "Grocery list", body: "Milk and bread", updatedAt: "2026-01-01T10:00:00Z" },
  { id: "2", title: "Trip", body: "Train to Kyoto", updatedAt: "2026-01-02T10:00:00Z" },
];

test("creates an empty note with a stable timestamp", () => {
  const now = new Date("2026-04-05T12:00:00Z");
  const note = createNote(now);
  assert.equal(note.title, "Untitled note");
  assert.equal(note.body, "");
  assert.equal(note.updatedAt, now.toISOString());
  assert.ok(note.id.startsWith(String(now.getTime())));
});

test("derives a title from title, body, or fallback", () => {
  assert.equal(deriveTitle(notes[0]), "Grocery list");
  assert.equal(deriveTitle({ title: " ", body: "\n First thought" }), "First thought");
  assert.equal(deriveTitle({ title: "", body: "" }), "Untitled note");
});

test("filters case-insensitively across titles and bodies", () => {
  assert.deepEqual(filterNotes(notes, "GROCERY").map((n) => n.id), ["1"]);
  assert.deepEqual(filterNotes(notes, "kyoto").map((n) => n.id), ["2"]);
  assert.equal(filterNotes(notes, "missing").length, 0);
  assert.equal(filterNotes(notes, " ").length, 2);
});

test("builds compact note previews", () => {
  assert.equal(notePreview("  one\n\n two  "), "one two");
  assert.equal(notePreview(""), "No additional text");
  assert.equal(notePreview("abcdefgh", 5), "abcde…");
});

test("counts words including contractions and unicode", () => {
  assert.equal(countWords("Don’t forget the café — at 5pm."), 6);
  assert.equal(countWords("   "), 0);
  assert.equal(countWords("one"), 1);
});

test("sorts notes newest first without mutating input", () => {
  const sorted = sortNotes(notes);
  assert.deepEqual(sorted.map((n) => n.id), ["2", "1"]);
  assert.deepEqual(notes.map((n) => n.id), ["1", "2"]);
});

test("duplicates content with a fresh id and copy title", () => {
  const now = new Date("2026-04-05T12:00:00Z");
  const copy = duplicateNote(notes[0], now);
  assert.equal(copy.title, "Grocery list copy");
  assert.equal(copy.body, notes[0].body);
  assert.notEqual(copy.id, notes[0].id);
  assert.equal(copy.updatedAt, now.toISOString());
});
