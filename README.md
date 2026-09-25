# OpenRouter Model Filter

A static site for comparing models in the public [OpenRouter catalog](https://openrouter.ai/api/v1/models). Filter by context length, input and output token price, modalities, and supported parameters. Separate checkboxes include free models (either token price is zero) and batch models; both are off by default. Price options start at the lowest nonzero value in each column. OpenRouter native routes are excluded.

The interface uses React, Vite, Tailwind CSS, and shadcn/ui components. Color, radius, and typography tokens live in [src/index.css](src/index.css); dark mode follows the browser setting. Filters, search, sorting, and pagination are shareable in the URL hash. The UI supports English and Simplified Chinese, and Model IDs can be copied with one click.

## Run locally

```sh
npm ci
npm run dev
```

Open the URL shown by Vite. Run `npm test` for the catalog logic check and `npm run build` to create the static `dist/` site. Preview that build with `npm run preview`.

## Publish to GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) builds and publishes `dist/` on pushes to `main`. In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source before publishing this Vite version. The previous Pages source was `main` at `/`, which does not run the Vite build.

## Source

- [src/App.jsx](src/App.jsx): interface, catalog loading, and interactions
- [src/model.js](src/model.js): filtering, sorting, prices, and URL state
- [src/i18n.js](src/i18n.js): translated labels
- [src/index.css](src/index.css): shared shadcn design tokens

No API key is needed. The browser needs access to the OpenRouter catalog endpoint. If loading fails, use the retry button and check network access.
