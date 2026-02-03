# CubeSite — Algorithm Trainer

CubeSite is a static website for practicing Rubik’s Cube algorithms. The homepage renders a 3D cube and links to individual algorithm pages.

## Project structure

- `index.html` — main entry point with the 3D scene and algorithm list
- `algs/` — algorithm-specific pages and supporting scripts
- `assets/` — shared CSS and JavaScript
- `images/`, `imgAlgs/`, `textures/` — static assets
- `*.gltf`, `*.glb`, `scene.bin` — 3D model assets used by the scene
- `help.html` — supporting help/documentation page

## Run locally

Because the site is fully static, you can serve it with a simple HTTP server from the repository root:

```bash
python -m http.server 4173
```

Then open:

- <http://localhost:4173/index.html>
- <http://localhost:4173/help.html>

For changes in `algs/`, open the relevant page(s) under <http://localhost:4173/algs/>.

## Development notes

- There is no build step; edit files directly.
- Prefer relative paths for local assets (for example, `assets/...` or `./images/...`).
- Avoid renaming large binary model/texture files unless necessary.
