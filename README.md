# OpenRouter Model Filter

A dependency-free static page for exploring the public OpenRouter model catalog. It turns the catalog into a sortable table and lets you narrow models by context length, input/output price, modality, and supported parameters.

## Features

- Loads the current catalog from https://openrouter.ai/api/v1/models.
- Filters input and output prices in dollars per million tokens.
- Filters context length, input/output modalities, supported parameters, and OpenRouter-native models.
- Sorts by model name, model ID, context, price, or maximum output.
- Copies a model ID with the Clipboard API and a browser fallback.
- Keeps filter selections in the URL hash so a filtered view can be shared.
- Detects the browser language and provides the locales defined in [i18n.js](i18n.js), falling back to English.

No API key or build step is required. The browser needs network access to OpenRouter and permission to use the Clipboard API for copying IDs.

## Run locally

Serve the directory with a static HTTP server:

~~~sh
python3 -m http.server 8080
~~~

Open http://127.0.0.1:8080/ in a browser. You can also open [index.html](index.html) directly, although a local server gives more predictable browser behavior.

The published static page is [notcorwin.github.io/openrouter-filter](https://notcorwin.github.io/openrouter-filter/).

## Project layout

- [index.html](index.html)：accessible page shell and table structure；
- [app.js](app.js)：catalog loading, filtering, sorting and rendering；
- [state.js](state.js)：DOM references and UI state；
- [utils.js](utils.js)：price conversion, formatting and HTML escaping；
- [i18n.js](i18n.js)：locale labels and language selection；
- [style.css](style.css)：layout and visual styles。

## Help and contributions

If the catalog cannot load, check the browser console and network access to the OpenRouter models endpoint. When reporting a problem, include the browser, the filter URL hash, and the visible error without including private account data.

Small, focused pull requests are welcome. Keep the page dependency-free and update the relevant locale strings when changing user-facing labels.

Maintainer: [notCorwin](https://github.com/notCorwin).
