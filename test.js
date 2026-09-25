import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogOptions,
  defaultFilters,
  displayModelName,
  filterModels,
  modelModalities,
  normalizeCatalog,
  sortModels,
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
  assert.deepEqual(options.inputModalities, ["text"]);
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
  assert.equal(I18N.en.optionLabels.response_format, "Response Format");
  assert.equal(I18N["zh-CN"].optionLabels.response_format, "响应格式");
});

test("modalities put the most useful choices first", () => {
  const options = catalogOptions([
    {
      architecture: {
        input_modalities: ["file", "audio", "text", "video", "image", "other"],
        output_modalities: ["audio", "image", "text"],
      },
    },
  ]);
  assert.deepEqual(options.inputModalities, [
    "text",
    "image",
    "audio",
    "video",
    "file",
    "other",
  ]);
  assert.deepEqual(options.outputModalities, ["text", "image", "audio"]);
});

test("modality display and filtering share a safe source for missing and new values", () => {
  const model = {
    id: "test/multimodal",
    context_length: 262_144,
    pricing: { prompt: "0.000001", completion: "0.000002" },
    architecture: {
      input_modalities: [" audio ", "text", "text", "future", null, 5, ""],
      output_modalities: "invalid",
    },
    output_modalities: ["image", "text"],
  };
  assert.deepEqual(modelModalities(model, "input"), [
    "text",
    "audio",
    "future",
  ]);
  assert.deepEqual(modelModalities(model, "output"), ["text", "image"]);
  assert.deepEqual(
    modelModalities(
      { architecture: { input_modalities: [] }, input_modalities: ["text"] },
      "input",
    ),
    [],
  );
  assert.deepEqual(modelModalities({}, "output"), []);
  const options = catalogOptions([model]);
  assert.deepEqual(options.inputModalities, ["text", "audio", "future"]);
  const filters = {
    ...defaultFilters(options),
    inMods: ["future"],
    outMods: ["image"],
  };
  assert.deepEqual(filterModels([model], filters), [model]);
  assert.deepEqual(
    filterModels([model], { ...filters, inMods: ["video"] }),
    [],
  );
});

test("model labels omit the brand prefix while name sorting uses the visible label", () => {
  const models = [
    { id: "deepseek/deepseek-v3", name: "DeepSeek: DeepSeek V3" },
    { id: "qwen/qwen3", name: "Qwen: Qwen3" },
    { id: "other/model", name: "A Model" },
  ];
  assert.equal(displayModelName(models[0]), "DeepSeek V3");
  assert.equal(displayModelName(models[1]), "Qwen3");
  assert.equal(displayModelName(models[2]), "A Model");
  assert.equal(displayModelName({ id: "fallback/model" }), "fallback/model");
  assert.deepEqual(sortModels(models, "name", "asc").map(displayModelName), [
    "A Model",
    "DeepSeek V3",
    "Qwen3",
  ]);
});
