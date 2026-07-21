import { countWords, createNote, deriveTitle, duplicateNote, filterNotes, notePreview, sortNotes } from "./notes.js";

const STORAGE_KEY = "paper-notes-v1";
const seedNotes = [
  {
    id: "welcome",
    title: "Welcome to Paper",
    body: "A quiet place for thoughts.\n\nEverything you write is saved automatically in this browser. Create a new note, search your ideas, or simply begin typing.",
    updatedAt: "2026-07-21T14:42:00.000Z",
  },
  {
    id: "ideas",
    title: "Ideas for the weekend",
    body: "Visit the farmer’s market early\nBring the film camera\nTry the little bakery on Grove Street",
    updatedAt: "2026-07-20T16:18:00.000Z",
  },
  {
    id: "reading",
    title: "Reading list",
    body: "The Creative Act — Rick Rubin\nA Swim in a Pond in the Rain — George Saunders\nWays of Seeing — John Berger",
    updatedAt: "2026-07-18T09:05:00.000Z",
  },
];

const $ = (selector) => document.querySelector(selector);
const elements = {
  list: $("#notes-list"), count: $("#note-count"), search: $("#search"), title: $("#note-title"),
  body: $("#note-body"), date: $("#note-date"), words: $("#word-count"), save: $("#save-state"),
  sidebar: $(".sidebar"), scrim: $("#scrim"),
};

let notes = loadNotes();
let activeId = notes[0]?.id;
let saveTimer;

function loadNotes() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) && stored.length ? sortNotes(stored) : seedNotes;
  } catch { return seedNotes; }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  elements.save.classList.remove("saving");
  elements.save.innerHTML = "<span></span> Saved";
}

function scheduleSave() {
  clearTimeout(saveTimer);
  elements.save.classList.add("saving");
  elements.save.innerHTML = "<span></span> Saving";
  saveTimer = setTimeout(persist, 350);
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));
}

function relativeDate(iso) {
  const date = new Date(iso); const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function renderList() {
  const visible = filterNotes(sortNotes(notes), elements.search.value);
  elements.count.textContent = String(notes.length).padStart(2, "0");
  elements.list.innerHTML = visible.length ? visible.map((note) => `
    <article class="note-card ${note.id === activeId ? "active" : ""}" data-id="${note.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(deriveTitle(note))}">
      <span class="note-card-top">
        <input class="note-title-edit" data-title-id="${note.id}" value="${escapeHtml(deriveTitle(note))}" aria-label="Rename note" />
        <time>${relativeDate(note.updatedAt)}</time>
      </span>
      <span class="note-preview">${escapeHtml(notePreview(note.body))}</span>
    </article>`).join("") : `<div class="empty-list">No notes found.<br>Try another search.</div>`;
}

function renderEditor() {
  const note = notes.find((item) => item.id === activeId);
  if (!note) return;
  elements.title.value = note.title;
  elements.body.value = note.body;
  elements.date.textContent = formatDate(note.updatedAt);
  updateWordCount();
  renderList();
}

function updateWordCount() {
  const total = countWords(`${elements.title.value} ${elements.body.value}`);
  elements.words.textContent = `${total} ${total === 1 ? "word" : "words"}`;
}

function updateActive() {
  const note = notes.find((item) => item.id === activeId);
  if (!note) return;
  note.title = elements.title.value;
  note.body = elements.body.value;
  note.updatedAt = new Date().toISOString();
  updateWordCount(); renderList(); scheduleSave();
}

function addNote() {
  const note = createNote(); notes.unshift(note); activeId = note.id;
  elements.search.value = ""; renderEditor(); scheduleSave();
  elements.title.select(); closeSidebar();
}

function removeNote() {
  if (!activeId) return;
  notes = notes.filter((note) => note.id !== activeId);
  if (!notes.length) notes = [createNote()];
  activeId = sortNotes(notes)[0].id; renderEditor(); scheduleSave();
}

function copyNote() {
  const source = notes.find((note) => note.id === activeId);
  if (!source) return;
  const copy = duplicateNote(source); notes.unshift(copy); activeId = copy.id; renderEditor(); scheduleSave();
}

function closeSidebar() { document.body.classList.remove("sidebar-open"); }

elements.list.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  if (card && !event.target.matches(".note-title-edit")) { activeId = card.dataset.id; renderEditor(); closeSidebar(); }
});
elements.list.addEventListener("input", (event) => {
  if (!event.target.matches(".note-title-edit")) return;
  const note = notes.find((item) => item.id === event.target.dataset.titleId);
  if (!note) return;
  note.title = event.target.value;
  note.updatedAt = new Date().toISOString();
  if (note.id === activeId) {
    elements.title.value = event.target.value;
    updateWordCount();
  }
  scheduleSave();
});
elements.list.addEventListener("focusout", (event) => {
  if (event.target.matches(".note-title-edit")) renderList();
});
elements.list.addEventListener("keydown", (event) => {
  if (event.target.matches(".note-title-edit")) {
    if (event.key === "Enter") { event.preventDefault(); event.target.blur(); }
    return;
  }
  if ((event.key === "Enter" || event.key === " ") && event.target.matches(".note-card")) {
    event.preventDefault(); activeId = event.target.dataset.id; renderEditor(); closeSidebar();
  }
});
elements.title.addEventListener("input", updateActive);
elements.body.addEventListener("input", updateActive);
elements.search.addEventListener("input", renderList);
$("#new-note").addEventListener("click", addNote);
$("#delete-note").addEventListener("click", removeNote);
$("#duplicate-note").addEventListener("click", copyNote);
$("#menu-button").addEventListener("click", () => document.body.classList.add("sidebar-open"));
$(".mobile-close").addEventListener("click", closeSidebar);
elements.scrim.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") { event.preventDefault(); addNote(); }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); elements.search.focus(); }
});

renderEditor();
