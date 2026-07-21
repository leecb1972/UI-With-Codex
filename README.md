# Paper Notes Desktop

A macOS notes application built with Electron, React, TypeScript, and Vite.

## Development

```bash
npm install
npm run dev
```

This starts Vite and opens the Electron desktop window with live renderer updates.

## Production

```bash
npm run build
npm start
```

The production build is written to `dist/` and the compiled Electron main process to `dist-electron/`.

## Verification

```bash
npm test
npm run typecheck
```

Notes and the selected color scheme are persisted locally by Electron. The app does not require a network connection after its dependencies are installed.
