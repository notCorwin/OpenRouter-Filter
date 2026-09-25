import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_LOCALE, I18N, LOCALES } from "./i18n.js";
import {
  catalogOptions,
  defaultFilters,
  displayModelName,
  filterModels,
  formatContext,
  formatPrice,
  normalizeCatalog,
  pricePerMillion,
  sortModels,
} from "./model.js";

const COMMON_PARAMETERS = [
  "tools",
  "response_format",
  "reasoning",
  "max_completion_tokens",
  "temperature",
  "top_p",
];

const ADVANCED_PARAMETERS = [
  "structured_outputs",
  "reasoning_effort",
  "include_reasoning",
  "max_tokens",
  "stop",
  "seed",
  "tool_choice",
  "parallel_tool_calls",
  "web_search_options",
  "frequency_penalty",
  "presence_penalty",
  "repetition_penalty",
  "top_k",
  "min_p",
  "top_a",
  "logprobs",
  "top_logprobs",
  "logit_bias",
  "prediction",
  "verbosity",
];

function initialLanguage() {
  try {
    const saved = localStorage.getItem("or_filter_lang");
    if (I18N[saved]) return saved;
  } catch {
    /* Storage can be disabled. */
  }
  for (const lang of navigator.languages || [navigator.language]) {
    if (lang?.toLowerCase().startsWith("zh")) return "zh-CN";
    if (lang?.toLowerCase().startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}

function copyFallback(value) {
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Clipboard copy failed");
}

function Picker({ id, label, value, choices, onChange, className, disabled }) {
  const items = choices.map(([value, label]) => ({ value, label }));
  return (
    <Select
      items={items}
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        className="max-h-[min(16rem,var(--available-height))]"
      >
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function CopyText({
  value,
  copyKey,
  label,
  copiedLabel,
  copied,
  onCopy,
  className,
  wrap,
}) {
  const done = copied?.key === copyKey;
  const action = `${done ? copiedLabel : label}: ${value}`;
  return (
    <Button
      type="button"
      variant="link"
      size="xs"
      className={cn(
        "h-auto min-w-0 max-w-full justify-start px-0 text-left",
        className,
      )}
      aria-label={action}
      title={action}
      onClick={() => onCopy(value, copyKey)}
    >
      <span
        className={cn(
          "min-w-0",
          wrap ? "whitespace-normal break-words" : "truncate",
        )}
      >
        {value}
      </span>
      {done && <Check aria-hidden="true" />}
    </Button>
  );
}

function RangeField({
  title,
  prefix,
  min,
  max,
  options,
  onChange,
  t,
  locale,
  price = false,
}) {
  const values = price
    ? options.map((n) => [String(n), `${formatPrice(n)}/M`])
    : options.map((n) => [String(n), n.toLocaleString(locale)]);
  return (
    <FieldSet className="min-w-0 gap-3">
      <FieldLegend variant="label">{title}</FieldLegend>
      <FieldGroup className="grid grid-cols-2 gap-2">
        <Field className="min-w-0">
          <FieldLabel
            htmlFor={`${prefix}-min`}
            className="text-muted-foreground"
          >
            {t.min}
          </FieldLabel>
          <Picker
            id={`${prefix}-min`}
            label={`${title}: ${t.min}`}
            className="w-full"
            value={min}
            onChange={(value) => onChange(`${prefix}Min`, value)}
            choices={[
              ...(!price ? [["0", t.unlimited]] : []),
              ...(price && values.length === 0 ? [["0", "$0/M"]] : []),
              ...values,
            ]}
          />
        </Field>
        <Field className="min-w-0">
          <FieldLabel
            htmlFor={`${prefix}-max`}
            className="text-muted-foreground"
          >
            {t.max}
          </FieldLabel>
          <Picker
            id={`${prefix}-max`}
            label={`${title}: ${t.max}`}
            className="w-full"
            value={max}
            onChange={(value) => onChange(`${prefix}Max`, value)}
            choices={[...values, ["Infinity", t.unlimited]]}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

function ChoiceField({
  idPrefix,
  title,
  ariaLabel,
  values,
  selected,
  onChange,
  labels,
  descriptions,
}) {
  return (
    <FieldSet className="min-w-0 gap-2" aria-label={ariaLabel}>
      {title && <FieldLegend variant="label">{title}</FieldLegend>}
      <FieldGroup
        className={cn(
          descriptions
            ? "grid gap-3 md:grid-cols-2"
            : "flex flex-row flex-wrap gap-x-5 gap-y-1",
        )}
      >
        {values.map((value) => {
          const id = `${idPrefix}-${value}`;
          const description = descriptions?.[value];
          return (
            <Field
              orientation="horizontal"
              className={cn(
                "min-w-0 gap-2",
                descriptions ? "items-start" : "min-h-9 w-auto",
              )}
              key={value}
            >
              <Checkbox
                id={id}
                checked={selected.includes(value)}
                onCheckedChange={(checked) => onChange(value, checked)}
                aria-describedby={description ? `${id}-description` : undefined}
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <FieldLabel
                  htmlFor={id}
                  className="w-auto min-w-0 cursor-pointer text-sm font-normal leading-tight"
                  title={value}
                >
                  {labels[value] ||
                    value
                      .replaceAll("_", " ")
                      .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                </FieldLabel>
                {description && (
                  <FieldDescription
                    id={`${id}-description`}
                    className="text-xs leading-snug"
                  >
                    {description}
                  </FieldDescription>
                )}
              </div>
            </Field>
          );
        })}
      </FieldGroup>
    </FieldSet>
  );
}

function CheckboxField({ id, label, description, checked, onChange }) {
  return (
    <Field
      orientation="horizontal"
      className="w-auto min-w-0 items-center gap-2"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(Boolean(value))}
      />
      <FieldContent>
        <FieldLabel htmlFor={id} className="cursor-pointer">
          {label}
        </FieldLabel>
        <FieldDescription className="text-xs">{description}</FieldDescription>
      </FieldContent>
    </Field>
  );
}

export default function App() {
  const [language, setLanguage] = useState(initialLanguage);
  const [models, setModels] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [filters, setFilters] = useState(null);
  const [copied, setCopied] = useState(null);
  const [copyError, setCopyError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const t = I18N[language];
  const options = useMemo(
    () => (models ? catalogOptions(models) : null),
    [models],
  );
  const commonParameters = COMMON_PARAMETERS.filter((value) =>
    options?.parameters.includes(value),
  );
  const advancedParameters = [
    ...ADVANCED_PARAMETERS.filter((value) =>
      options?.parameters.includes(value),
    ),
    ...(options?.parameters.filter(
      (value) =>
        !COMMON_PARAMETERS.includes(value) &&
        !ADVANCED_PARAMETERS.includes(value),
    ) || []),
  ];
  const selectedAdvanced =
    filters?.params.filter((value) => advancedParameters.includes(value)) || [];

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.title;
    try {
      localStorage.setItem("or_filter_lang", language);
    } catch {
      /* Storage can be disabled. */
    }
  }, [language, t.title]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("https://openrouter.ai/api/v1/models", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        setModels(normalizeCatalog(payload));
        setError("");
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const clearHash = () => {
      if (location.hash) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    };
    clearHash();
    addEventListener("hashchange", clearHash);
    return () => removeEventListener("hashchange", clearHash);
  }, []);

  useEffect(() => {
    if (!options) return;
    setFilters((current) => current ?? defaultFilters(options));
  }, [options]);

  const update = (patch) => {
    if (!filters) return;
    setFilters({ ...filters, ...patch });
  };
  const toggleChoice = (key, value, checked) =>
    update({
      [key]: checked
        ? [...filters[key], value]
        : filters[key].filter((item) => item !== value),
    });
  const matches = useMemo(
    () =>
      filters && models
        ? sortModels(filterModels(models, filters), filters.sort, filters.dir)
        : [],
    [filters, models],
  );

  async function copyText(value, key) {
    try {
      if (navigator.clipboard?.writeText)
        await navigator.clipboard.writeText(value);
      else copyFallback(value);
      setCopied({ key, value });
      setCopyError("");
      setTimeout(
        () => setCopied((current) => (current?.key === key ? null : current)),
        1600,
      );
    } catch {
      try {
        copyFallback(value);
        setCopied({ key, value });
        setCopyError("");
        setTimeout(
          () => setCopied((current) => (current?.key === key ? null : current)),
          1600,
        );
      } catch {
        setCopied(null);
        setCopyError(t.copyFailed);
      }
    }
  }

  const columns = [
    ["name", t.colName],
    ["id", "Model ID"],
    ["context", t.colContext],
    ["prompt", t.colInputPrice],
    ["completion", t.colOutputPrice],
    ["maxOutput", t.colMaxOutput],
  ];

  return (
    <main
      id="main"
      className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Search aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t.description}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <label htmlFor="language" className="sr-only">
            Language
          </label>
          <Picker
            id="language"
            label="Language"
            value={language}
            onChange={setLanguage}
            choices={Object.entries(LOCALES)}
          />
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t.loadFailed}</AlertTitle>
          <AlertDescription>
            {t.errorDescription} {error}
          </AlertDescription>
          <AlertAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError("");
                setRetry((value) => value + 1);
              }}
            >
              {t.retry}
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!error && (
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                {t.filters}
              </CardTitle>
              <CardDescription>{t.filtersDescription}</CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden"
                  aria-expanded={filtersOpen}
                  aria-controls="filter-content"
                  onClick={() => setFiltersOpen((open) => !open)}
                >
                  {filtersOpen ? t.hideFilters : t.showFilters}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent
              id="filter-content"
              className={cn(
                "flex flex-col gap-5",
                !filtersOpen && "hidden md:flex",
              )}
            >
              {filters && options ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <RangeField
                      title={t.contextLabel}
                      prefix="ctx"
                      min={filters.ctxMin}
                      max={filters.ctxMax}
                      options={options.contexts}
                      onChange={(key, value) => update({ [key]: value })}
                      t={t}
                      locale={language}
                    />
                    <RangeField
                      title={t.inPriceLabel}
                      prefix="in"
                      min={filters.inMin}
                      max={filters.inMax}
                      options={options.inputPrices}
                      onChange={(key, value) => update({ [key]: value })}
                      t={t}
                      locale={language}
                      price
                    />
                    <RangeField
                      title={t.outPriceLabel}
                      prefix="out"
                      min={filters.outMin}
                      max={filters.outMax}
                      options={options.outputPrices}
                      onChange={(key, value) => update({ [key]: value })}
                      t={t}
                      locale={language}
                      price
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    <CheckboxField
                      id="free"
                      label={t.includeFree}
                      description={t.includeFreeDescription}
                      checked={filters.free}
                      onChange={(free) => update({ free })}
                    />
                    <CheckboxField
                      id="batch"
                      label={t.includeBatch}
                      description={t.includeBatchDescription}
                      checked={filters.batch}
                      onChange={(batch) => update({ batch })}
                    />
                  </div>
                  <Separator />
                  <div className="grid gap-5 md:grid-cols-2">
                    <ChoiceField
                      idPrefix="in-mod"
                      title={t.inputModalityLabel}
                      values={options.inputModalities}
                      selected={filters.inMods}
                      onChange={(value, checked) =>
                        toggleChoice("inMods", value, checked)
                      }
                      labels={t.optionLabels}
                    />
                    <ChoiceField
                      idPrefix="out-mod"
                      title={t.outputModalityLabel}
                      values={options.outputModalities}
                      selected={filters.outMods}
                      onChange={(value, checked) =>
                        toggleChoice("outMods", value, checked)
                      }
                      labels={t.optionLabels}
                    />
                  </div>
                  <Separator />
                  <ChoiceField
                    idPrefix="param"
                    title={t.paramsLabel}
                    values={commonParameters}
                    selected={filters.params}
                    onChange={(value, checked) =>
                      toggleChoice("params", value, checked)
                    }
                    labels={t.optionLabels}
                  />
                  {advancedParameters.length > 0 && (
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                        {t.advancedParamsLabel}
                        <Badge variant="secondary">
                          {advancedParameters.length}
                        </Badge>
                        {selectedAdvanced.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {t.selectedCount} {selectedAdvanced.length}
                          </span>
                        )}
                        <ChevronDown
                          aria-hidden="true"
                          className="size-4 transition-transform group-open:rotate-180"
                        />
                      </summary>
                      <div className="pt-3">
                        <ChoiceField
                          idPrefix="param"
                          ariaLabel={t.advancedParamsLabel}
                          values={advancedParameters}
                          selected={filters.params}
                          onChange={(value, checked) =>
                            toggleChoice("params", value, checked)
                          }
                          labels={t.optionLabels}
                          descriptions={t.parameterDescriptions}
                        />
                      </div>
                    </details>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}
            </CardContent>
            <CardFooter
              className={cn("justify-end", !filtersOpen && "hidden md:flex")}
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={!filters}
                onClick={() => update(defaultFilters(options))}
              >
                <RotateCcw data-icon="inline-start" />
                {t.reset}
              </Button>
            </CardFooter>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <CardTitle>
                  {t.results}{" "}
                  {models && (
                    <Badge variant="secondary" className="ml-1">
                      {matches.length.toLocaleString(language)}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{t.resultsDescription}</CardDescription>
              </div>
              <Field className="w-full sm:w-64">
                <FieldLabel htmlFor="search" className="sr-only">
                  {t.search}
                </FieldLabel>
                <Input
                  id="search"
                  type="search"
                  value={filters?.query || ""}
                  onChange={(event) => update({ query: event.target.value })}
                  placeholder={t.searchPlaceholder}
                  disabled={!filters}
                />
              </Field>
              <div className="flex items-center gap-2 lg:hidden">
                <label
                  htmlFor="mobile-sort"
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {t.sortBy}
                </label>
                <Picker
                  id="mobile-sort"
                  label={t.sortBy}
                  className="min-w-0 flex-1"
                  value={filters?.sort || "completion"}
                  onChange={(value) => update({ sort: value })}
                  disabled={!filters}
                  choices={columns}
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!filters}
                  aria-label={
                    filters?.dir === "asc" ? t.ascending : t.descending
                  }
                  title={filters?.dir === "asc" ? t.ascending : t.descending}
                  onClick={() =>
                    update({ dir: filters.dir === "asc" ? "desc" : "asc" })
                  }
                >
                  {filters?.dir === "asc" ? <ArrowUp /> : <ArrowDown />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              {copyError && (
                <Alert variant="destructive" className="mx-3 mb-3 w-auto">
                  <AlertDescription>{copyError}</AlertDescription>
                </Alert>
              )}
              {models && matches.length === 0 ? (
                <Empty className="py-16">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>{t.noResults}</EmptyTitle>
                    <EmptyDescription>
                      {t.noResultsDescription}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      onClick={() => update(defaultFilters(options))}
                    >
                      {t.reset}
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <>
                  <ItemGroup className="gap-2 px-3 lg:hidden">
                    {models
                      ? matches.map((model) => {
                          const input = pricePerMillion(model.pricing?.prompt);
                          const output = pricePerMillion(
                            model.pricing?.completion,
                          );
                          return (
                            <Item
                              key={model.id}
                              role="listitem"
                              variant="outline"
                              size="sm"
                            >
                              <ItemContent className="min-w-0">
                                <ItemTitle className="max-w-full">
                                  <CopyText
                                    value={displayModelName(model)}
                                    copyKey={`${model.id}:name`}
                                    label={t.copyName}
                                    copiedLabel={t.copied}
                                    copied={copied}
                                    onCopy={copyText}
                                    className="text-sm"
                                  />
                                </ItemTitle>
                                <ItemDescription
                                  className="min-w-0"
                                  translate="no"
                                >
                                  <CopyText
                                    value={model.id}
                                    copyKey={`${model.id}:id`}
                                    label={t.copyId}
                                    copiedLabel={t.copied}
                                    copied={copied}
                                    onCopy={copyText}
                                    className="font-mono text-xs font-normal text-muted-foreground"
                                  />
                                </ItemDescription>
                              </ItemContent>
                              <ItemFooter className="grid grid-cols-2 gap-2 border-t border-border pt-2 text-xs tabular-nums">
                                {[
                                  [
                                    t.colContext,
                                    formatContext(model.context_length),
                                  ],
                                  [
                                    t.colMaxOutput,
                                    formatContext(
                                      model.top_provider?.max_completion_tokens,
                                    ),
                                  ],
                                  [
                                    t.colInputPrice,
                                    input === 0 ? t.free : formatPrice(input),
                                  ],
                                  [
                                    t.colOutputPrice,
                                    output === 0 ? t.free : formatPrice(output),
                                  ],
                                ].map(([label, value]) => (
                                  <div
                                    key={label}
                                    className="flex min-w-0 justify-between gap-2"
                                  >
                                    <span className="text-muted-foreground">
                                      {label}
                                    </span>
                                    <span className="font-medium">{value}</span>
                                  </div>
                                ))}
                              </ItemFooter>
                            </Item>
                          );
                        })
                      : Array.from({ length: 5 }, (_, index) => (
                          <Item key={index} variant="outline">
                            <Skeleton className="h-14 w-full" />
                          </Item>
                        ))}
                  </ItemGroup>
                  <div className="hidden lg:block">
                    <Table className="min-w-[760px] tabular-nums [&_tr>*:first-child]:pl-6 [&_tr>*:last-child]:pr-6">
                      <TableHeader>
                        <TableRow>
                          {columns.map(([key, label]) => (
                            <TableHead
                              key={key}
                              className={
                                key === "name" || key === "id"
                                  ? "text-left"
                                  : "text-right"
                              }
                              aria-sort={
                                filters?.sort === key
                                  ? filters.dir === "asc"
                                    ? "ascending"
                                    : "descending"
                                  : "none"
                              }
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "w-full px-0",
                                  key === "name" || key === "id"
                                    ? "justify-start"
                                    : "justify-end",
                                )}
                                title={`${t.sortBy}: ${label}`}
                                disabled={!filters}
                                onClick={() =>
                                  update({
                                    sort: key,
                                    dir:
                                      filters.sort === key &&
                                      filters.dir === "asc"
                                        ? "desc"
                                        : "asc",
                                  })
                                }
                              >
                                {filters?.sort === key &&
                                  (filters.dir === "asc" ? (
                                    <ArrowUp aria-hidden="true" />
                                  ) : (
                                    <ArrowDown aria-hidden="true" />
                                  ))}
                                {label}
                              </Button>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {models
                          ? matches.map((model) => {
                              const input = pricePerMillion(
                                model.pricing?.prompt,
                              );
                              const output = pricePerMillion(
                                model.pricing?.completion,
                              );
                              return (
                                <TableRow key={model.id}>
                                  <TableCell className="max-w-52 whitespace-normal font-medium break-words">
                                    <CopyText
                                      value={displayModelName(model)}
                                      copyKey={`${model.id}:name`}
                                      label={t.copyName}
                                      copiedLabel={t.copied}
                                      copied={copied}
                                      onCopy={copyText}
                                      className="text-sm"
                                      wrap
                                    />
                                  </TableCell>
                                  <TableCell className="max-w-56">
                                    <CopyText
                                      value={model.id}
                                      copyKey={`${model.id}:id`}
                                      label={t.copyId}
                                      copiedLabel={t.copied}
                                      copied={copied}
                                      onCopy={copyText}
                                      className="font-mono text-xs font-normal text-muted-foreground"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right font-mono tabular-nums">
                                    {formatContext(model.context_length)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono tabular-nums">
                                    {input === 0 ? (
                                      <Badge variant="secondary">
                                        {t.free}
                                      </Badge>
                                    ) : (
                                      formatPrice(input)
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-mono tabular-nums">
                                    {output === 0 ? (
                                      <Badge variant="secondary">
                                        {t.free}
                                      </Badge>
                                    ) : (
                                      formatPrice(output)
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-mono tabular-nums">
                                    {formatContext(
                                      model.top_provider?.max_completion_tokens,
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          : Array.from({ length: 8 }, (_, index) => (
                              <TableRow key={index}>
                                {columns.map(([key]) => (
                                  <TableCell key={key}>
                                    <Skeleton className="h-5 w-full" />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              <span aria-live="polite">
                {models
                  ? `${matches.length.toLocaleString(language)} ${t.models}`
                  : t.loading}
              </span>
            </CardFooter>
          </Card>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? `${t.copied}: ${copied.value}` : copyError}
      </span>
    </main>
  );
}
