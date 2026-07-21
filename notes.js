export function createNote(now = new Date()) {
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "Untitled note",
    body: "",
    updatedAt: now.toISOString(),
  };
}

export function deriveTitle(note) {
  const title = note.title.trim();
  if (title) return title;
  const firstLine = note.body.split("\n").find((line) => line.trim());
  return firstLine?.trim().slice(0, 60) || "Untitled note";
}

export function notePreview(body, maxLength = 90) {
  const clean = body.replace(/\s+/g, " ").trim();
  if (!clean) return "No additional text";
  return clean.length > maxLength ? `${clean.slice(0, maxLength).trim()}…` : clean;
}

export function filterNotes(notes, query) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return notes;
  return notes.filter((note) =>
    `${note.title}\n${note.body}`.toLocaleLowerCase().includes(needle),
  );
}

export function countWords(text) {
  const words = text.trim().match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu);
  return words?.length ?? 0;
}

export function sortNotes(notes) {
  return [...notes].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function duplicateNote(note, now = new Date()) {
  return {
    ...note,
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `${deriveTitle(note)} copy`,
    updatedAt: now.toISOString(),
  };
}
