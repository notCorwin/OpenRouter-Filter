export function normalizeCatalog(payload) {
  const catalog = payload?.data || payload;
  if (!Array.isArray(catalog)) throw new Error("Invalid model catalog");
  return catalog.filter(
    (model) =>
      typeof model?.id === "string" && !model.id.startsWith("openrouter/"),
  );
}

export function pricePerMillion(value) {
  const price = Number(value);
  return value == null || value === "" || !Number.isFinite(price) || price < 0
    ? null
    : price * 1_000_000;
}

const modalityOrder = { text: 0, image: 1, audio: 2, video: 3, file: 4 };
const compareModalities = (a, b) =>
  (Object.hasOwn(modalityOrder, a) ? modalityOrder[a] : 99) -
    (Object.hasOwn(modalityOrder, b) ? modalityOrder[b] : 99) ||
  a.localeCompare(b);

export function modelModalities(model, direction) {
  const fromArchitecture = model.architecture?.[`${direction}_modalities`];
  const fromModel = model[`${direction}_modalities`];
  const values = Array.isArray(fromArchitecture)
    ? fromArchitecture
    : Array.isArray(fromModel)
      ? fromModel
      : [];
  return [
    ...new Set(
      values.flatMap((value) =>
        typeof value === "string" && value.trim() ? [value.trim()] : [],
      ),
    ),
  ].sort(compareModalities);
}

export function modelCapabilities(model) {
  const input = modelModalities(model, "input");
  const output = modelModalities(model, "output");
  return [...new Set([...input, ...output])]
    .sort(compareModalities)
    .map((modality) => ({
      modality,
      input: input.includes(modality),
      output: output.includes(modality),
    }));
}

export function catalogOptions(models) {
  const unique = (values) => [...new Set(values)].sort((a, b) => a - b);
  const modalities = (direction) =>
    [
      ...new Set(models.flatMap((model) => modelModalities(model, direction))),
    ].sort(compareModalities);
  return {
    contexts: unique([
      256_000,
      ...models
        .map((m) => m.context_length)
        .filter((n) => Number.isFinite(n) && n > 0),
    ]),
    inputPrices: unique(
      models
        .map((m) => pricePerMillion(m.pricing?.prompt))
        .filter((n) => n > 0),
    ),
    outputPrices: unique(
      models
        .map((m) => pricePerMillion(m.pricing?.completion))
        .filter((n) => n > 0),
    ),
    inputModalities: modalities("input"),
    outputModalities: modalities("output"),
    parameters: [
      ...new Set(models.flatMap((m) => m.supported_parameters || [])),
    ].sort(),
  };
}

export function defaultFilters(options) {
  return {
    ctxMin: "256000",
    ctxMax: "Infinity",
    inMin: String(options.inputPrices.find((n) => n > 0) ?? 0),
    inMax: "Infinity",
    outMin: String(options.outputPrices.find((n) => n > 0) ?? 0),
    outMax: "Infinity",
    free: false,
    batch: false,
    latest: false,
    inMods: options.inputModalities.includes("text") ? ["text"] : [],
    outMods: options.outputModalities.includes("text") ? ["text"] : [],
    params: options.parameters.includes("tools") ? ["tools"] : [],
    query: "",
    sort: "completion",
    dir: "asc",
  };
}

export function filterModels(models, filters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return models.filter((model) => {
    if (
      !filters.batch &&
      (model.id.endsWith(":batch") || /\(batch\)/i.test(model.name || ""))
    )
      return false;
    if (
      !filters.latest &&
      (/(?:^|[-_/:])latest(?=$|[-_/:])/i.test(model.id) ||
        /\blatest\b/i.test(model.name || ""))
    )
      return false;
    if (
      query &&
      !`${model.name} ${model.id}`.toLocaleLowerCase().includes(query)
    )
      return false;
    if (model.context_length == null) {
      if (filters.ctxMin !== "0" || filters.ctxMax !== "Infinity") return false;
    } else if (
      model.context_length < +filters.ctxMin ||
      model.context_length > +filters.ctxMax
    )
      return false;
    for (const [key, selected] of [
      ["input", filters.inMods],
      ["output", filters.outMods],
    ]) {
      const supported = modelModalities(model, key);
      if (!selected.every((value) => supported.includes(value))) return false;
    }
    if (
      !filters.params.every((value) =>
        (model.supported_parameters || []).includes(value),
      )
    )
      return false;
    const input = pricePerMillion(model.pricing?.prompt);
    const output = pricePerMillion(model.pricing?.completion);
    if (input === 0 || output === 0) return filters.free;
    return (
      input !== null &&
      output !== null &&
      input >= +filters.inMin &&
      input <= +filters.inMax &&
      output >= +filters.outMin &&
      output <= +filters.outMax
    );
  });
}

export function displayModelName(model) {
  return (model.name || model.id).replace(/^[^:]+:\s+/, "");
}

export function sortModels(models, field, dir) {
  const value = (model) =>
    ({
      name: displayModelName(model),
      id: model.id || "",
      context: model.context_length,
      prompt: pricePerMillion(model.pricing?.prompt),
      completion: pricePerMillion(model.pricing?.completion),
      maxOutput: model.top_provider?.max_completion_tokens,
    })[field];
  const sign = dir === "desc" ? -1 : 1;
  return [...models].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    if (left == null) return right == null ? 0 : 1;
    if (right == null) return -1;
    return (
      sign *
      (typeof left === "string" ? left.localeCompare(right) : left - right)
    );
  });
}

export function formatContext(value) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(2))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(1))}K`;
  return String(value);
}

export function formatPrice(value) {
  if (value == null) return "—";
  if (value === 0) return "$0";
  if (value < 0.000001) return `$${value.toExponential(2)}`;
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value)}`;
}
