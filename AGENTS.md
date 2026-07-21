# Project Agents

This project was created and revised by the primary Codex coding agent. No
delegated sub-agents were used.

## Primary agent: Codex

Responsibilities:

- Designed the responsive two-pane notepad interface.
- Implemented the application with HTML, CSS, and vanilla JavaScript.
- Added local browser persistence, autosave, search, note creation, deletion,
  duplication, inline title editing, and keyboard shortcuts.
- Extracted the note-domain functions into `notes.js` for independent testing.
- Added and ran the Node.js unit tests in `notes.test.js`.
- Applied browser feedback to refine the sidebar and button styling.

## Project conventions

- Keep the application dependency-free at runtime.
- Put reusable note logic in `notes.js` rather than coupling it to the DOM.
- Preserve keyboard and screen-reader accessibility when changing controls.
- Store user notes under the `paper-notes-v1` local-storage key.
- Run `npm test` after changing note logic or interactions.
- Run `node --check app.js` after changing browser behavior.

## Important files

- `index.html` — application structure and accessible controls.
- `styles.css` — responsive layout and visual design.
- `app.js` — UI behavior, persistence, and event handling.
- `notes.js` — reusable note-domain functions.
- `notes.test.js` — unit tests.
- `package.json` — local server and test commands.

## Validation

```sh
npm test
node --check app.js
```
