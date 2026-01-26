# AGENTS.md — CubeSite

## Scope
These instructions apply to the entire repository.

## Repository overview
- This is a static website centered around `index.html` plus subpages in `algs/`.
- The site relies on Babylon.js, external CDNs, and local assets (images, textures, and models).
- There is no build step configured in this repo.

## Key structure (quick map)
- `index.html`: main entry point with the 3D scene canvas and algorithm list.
- `assets/`: CSS and JavaScript that drive layout and interaction.
- `algs/`: algorithm-specific pages and supporting scripts.
- `images/`, `imgAlgs/`, `textures/`: static image/texture assets.
- `*.gltf`, `*.glb`, `scene.bin`: 3D model assets.
- `help.html`: supporting documentation page.

## Editing guidelines
- Prefer small, focused changes that match the existing style.
- Keep asset paths relative (for example, `./images/...` or `assets/...`).
- Avoid introducing new external dependencies unless necessary.
- Do not add a build system unless explicitly requested.

## HTML/CSS conventions
- Preserve the existing indentation style in each file.
- Reuse existing CSS classes before introducing new ones.
- When adding anchors between sections, prefer existing ids such as `#renderCanvas` and `#algSection`.

## JavaScript conventions
- Favor simple, inline-compatible scripts unless there is already a module/file handling the behavior.
- Do not wrap imports in `try/catch` blocks.
- Prefer extending existing helper functions over creating near-duplicates.

## Validation
Because this is a static site, validation is primarily manual.

- Recommended local server from the repo root:
  - `python -m http.server 4173`
- Then open:
  - `http://localhost:4173/index.html`
  - `http://localhost:4173/help.html`
- When changes affect algorithm pages, also open one or two relevant pages under `algs/`.

## Asset hygiene
- Do not rename or move large binary assets unless required by the task.
- If you add assets, place them in an existing logical folder (`images/`, `assets/`, `textures/`, etc.).
- Prefer optimized/compressed assets when adding new media.
