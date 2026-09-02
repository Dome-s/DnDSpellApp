# DnD Spell App

A React application for browsing Dungeons & Dragons 5e spells, alongside interactive portfolio projects. The project uses Vite for development and production builds, Vitest for tests, Tailwind CSS for styling, and Electron for the optional desktop build.

## Setup

Install dependencies:

```sh
npm install
```

Start the Vite development server at <http://localhost:5173>:

```sh
npm start
```

## Commands

- `npm run build` creates a production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm test` starts Vitest in watch mode.
- `npm run test:run` runs the test suite once.
- `npm run electron-start` starts Vite and Electron for desktop development.
- `npm run electron-build-and-run` builds the web app and packages Electron.
- `npm run deploy` builds and deploys `dist/` with GitHub Pages.

## Project structure

- `src/components/` contains shared React components and the WebGL fluid simulation.
- `src/pages/` contains the main application pages.
- `src/data/` contains spell data grouped by sourcebook.
- `src/utils/` contains spell parsing and filtering utilities.
- `public/` contains static icons and web-app metadata.
- `electron.cjs` is the optional Electron main process.
- `vite.config.mjs` configures Vite and Vitest.
