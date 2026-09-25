import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogOptions,
  defaultFilters,
  filterModels,
  normalizeCatalog,
  readFilters,
  serializeFilters,
} from "./src/model.js";
import { I18N } from "./src/i18n.js";

test("catalog filtering keeps paid minimums separate from the free toggle and excludes native routes", () => {
  const shared = {
    context_length: 262_144,
    architecture: { input_modalities: ["text"], output_modalities: ["text"] },
    supported_parameters: ["tools"],
  };
  const models = normalizeCatalog({
    data: [
      {
        ...shared,
        id: "free/model",
        pricing: { prompt: "0", completion: "0" },
      },
      {
        ...shared,
        id: "free/input",
        pricing: { prompt: "0", completion: "0.000002" },
      },
      {
        ...shared,
        id: "free/output",
        pricing: { prompt: "0.000001", completion: "0" },
      },
      {
        ...shared,
        id: "paid/model",
        pricing: { prompt: "0.000001", completion: "0.000002" },
      },
      {
        ...shared,
        id: "paid/other",
        pricing: { prompt: "0.000003", completion: "0.000004" },
      },
      {
        ...shared,
        id: "paid/model:batch",
        pricing: { prompt: "0.000001", completion: "0.000002" },
      },
      {
        ...shared,
        id: "paid/unknown-context",
        context_length: null,
        pricing: { prompt: "0.000003", completion: "0.000004" },
      },
      {
        ...shared,
        id: "openrouter/native",
        pricing: { prompt: "0", completion: "0" },
      },
    ],
  });
  const options = catalogOptions(models);
  const defaults = defaultFilters(options);
  assert.equal(defaults.inMin, "1");
  assert.equal(defaults.outMin, "2");
  assert.equal(defaults.ctxMin, "256000");
  assert.equal(options.inputPrices[0], 1);
  assert.equal(options.outputPrices[0], 2);
  assert.equal(defaults.batch, false);
  assert.deepEqual(
    filterModels(models, defaults).map((model) => model.id),
    ["paid/model", "paid/other"],
  );
  assert.deepEqual(
    filterModels(models, { ...defaults, free: true }).map((model) => model.id),
    ["free/model", "free/input", "free/output", "paid/model", "paid/other"],
  );
  assert.deepEqual(
    filterModels(models, { ...defaults, batch: true }).map((model) => model.id),
    ["paid/model", "paid/other", "paid/model:batch"],
  );
  assert.equal(filterModels(models, { ...defaults, ctxMin: "0" }).length, 3);
  const restored = readFilters(
    `#${serializeFilters({ ...defaults, free: true, batch: true, query: "paid", page: 2 })}`,
    options,
  );
  assert.equal(restored.free, true);
  assert.equal(restored.batch, true);
  assert.equal(restored.query, "paid");
  assert.equal(restored.page, 2);
  assert.equal(I18N.en.optionLabels.response_format, "Response Format");
  assert.equal(I18N["zh-CN"].optionLabels.response_format, "响应格式");
});
