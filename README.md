# OpenRouter Model Filter

A static web app for finding OpenRouter models by context length, token price, input and output modalities, and supported parameters. It reads the [public OpenRouter model catalog](https://openrouter.ai/api/v1/models) directly in the browser, so no API key or backend is required.

## Features

- Filter by context length, input and output price, modalities, and parameters; search by model name or ID.
- Compare prices per million tokens and sort results by name, ID, context, price, or maximum output. Results start in ascending output price order.
- Copy a model name or Model ID with one click. Switch between English and Simplified Chinese; parameter labels are translated.
- Exclude `openrouter/` native routes. Free models (either input or output price is zero), Batch models, and Latest models each have a separate checkbox and are hidden by default.
- Start at a 256K minimum context, with smaller values available in the selector. Input and output price minimums start at their respective lowest nonzero catalog values.
- Use the responsive interface in light or dark mode, following your system preference.

## Get started

Use Node.js 24 and npm. Install dependencies and start the development server:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The page loads the current catalog from OpenRouter, so your browser needs network access to that endpoint.

To check or build the project:

```sh
npm test
npm run build
npm run preview
```

`npm test` checks the catalog filtering logic. `npm run build` creates the deployable static site in `dist/`; `npm run preview` serves that build locally.

## Deployment

The [GitHub Pages workflow](.github/workflows/pages.yml) runs tests, builds the site, and publishes `dist/` on pushes to `main`. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source. The Vite build uses relative asset paths, so `dist/` can also be served by another static host.

## Project files

- [src/App.jsx](src/App.jsx) — catalog loading and interface
- [src/model.js](src/model.js) — catalog normalization, filtering, pricing, and sorting
- [src/i18n.js](src/i18n.js) — English and Simplified Chinese text
- [src/index.css](src/index.css) — shared design tokens and Tailwind CSS styles
- [test.js](test.js) — catalog logic tests

The UI is built with React, Vite, Tailwind CSS, and shadcn/ui components.

## Help and contributions

Report problems or suggest improvements in [GitHub Issues](https://github.com/notCorwin/openrouter-filter/issues). For catalog field definitions and model data, see the [OpenRouter Models API documentation](https://openrouter.ai/docs/api/api-reference/models/get-models).

Maintained by [notCorwin](https://github.com/notCorwin). Contributions are welcome: open an issue to discuss a change, then submit a pull request with `npm test` and `npm run build` passing.
