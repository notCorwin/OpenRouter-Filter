import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Copy,
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
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
  filterModels,
  formatContext,
  formatPrice,
  normalizeCatalog,
  pricePerMillion,
  readFilters,
  serializeFilters,
  sortModels,
} from "./model.js";

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
          <NativeSelect
            id={`${prefix}-min`}
            aria-label={`${title}: ${t.min}`}
            className="w-full"
            value={min}
            onChange={(event) => onChange(`${prefix}Min`, event.target.value)}
          >
            {!price && (
              <NativeSelectOption value="0">{t.unlimited}</NativeSelectOption>
            )}
            {price && values.length === 0 && (
              <NativeSelectOption value="0">$0/M</NativeSelectOption>
            )}
            {values.map(([value, label]) => (
              <NativeSelectOption value={value} key={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field className="min-w-0">
          <FieldLabel
            htmlFor={`${prefix}-max`}
            className="text-muted-foreground"
          >
            {t.max}
          </FieldLabel>
          <NativeSelect
            id={`${prefix}-max`}
            aria-label={`${title}: ${t.max}`}
            className="w-full"
            value={max}
            onChange={(event) => onChange(`${prefix}Max`, event.target.value)}
          >
            {values.map(([value, label]) => (
              <NativeSelectOption value={value} key={value}>
                {label}
              </NativeSelectOption>
            ))}
            <NativeSelectOption value="Infinity">
              {t.unlimited}
            </NativeSelectOption>
          </NativeSelect>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

function ChoiceField({
  idPrefix,
  title,
  values,
  selected,
  onChange,
  labels,
  count,
}) {
  return (
    <FieldSet className="min-w-0 gap-2">
      <FieldLegend variant="label" className="flex items-center gap-2">
        {title}
        {count && <Badge variant="secondary">{values.length}</Badge>}
      </FieldLegend>
      <FieldGroup className="flex flex-row flex-wrap gap-x-5 gap-y-1">
        {values.map((value) => {
          const id = `${idPrefix}-${value}`;
          return (
            <Field
              orientation="horizontal"
              className="min-h-9 w-auto min-w-0 gap-2"
              key={value}
            >
              <Checkbox
                id={id}
                checked={selected.includes(value)}
                onCheckedChange={(checked) => onChange(value, checked)}
              />
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
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const t = I18N[language];
  const options = useMemo(
    () => (models ? catalogOptions(models) : null),
    [models],
  );

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
    if (!options) return;
    const sync = () => setFilters(readFilters(location.hash, options));
    sync();
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, [options]);

  const update = (patch) => {
    if (!filters) return;
    const next = { ...filters, ...patch };
    setFilters(next);
    const hash = serializeFilters(next);
    if (location.hash.slice(1) !== hash) location.hash = hash;
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

  async function copyId(id) {
    try {
      if (navigator.clipboard?.writeText)
        await navigator.clipboard.writeText(id);
      else copyFallback(id);
      setCopied(id);
      setCopyError("");
      setTimeout(
        () => setCopied((current) => (current === id ? "" : current)),
        1600,
      );
    } catch {
      try {
        copyFallback(id);
        setCopied(id);
        setCopyError("");
        setTimeout(() => setCopied(""), 1600);
      } catch {
        setCopied("");
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
            <Badge variant="outline" className="mb-2">
              {t.eyebrow}
            </Badge>
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
          <NativeSelect
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label="Language"
          >
            {Object.entries(LOCALES).map(([code, label]) => (
              <NativeSelectOption key={code} value={code}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <span className="text-xs text-muted-foreground">{t.themeSystem}</span>
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
                  <p className="text-xs text-muted-foreground">{t.priceUnit}</p>
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
                    values={options.parameters}
                    selected={filters.params}
                    onChange={(value, checked) =>
                      toggleChoice("params", value, checked)
                    }
                    labels={t.optionLabels}
                    count
                  />
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
                <NativeSelect
                  id="mobile-sort"
                  className="min-w-0 flex-1"
                  value={filters?.sort || "completion"}
                  onChange={(event) => update({ sort: event.target.value })}
                  disabled={!filters}
                >
                  {columns.map(([key, label]) => (
                    <NativeSelectOption key={key} value={key}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
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
                                  {model.name || model.id}
                                </ItemTitle>
                                <ItemDescription
                                  className="truncate font-mono text-xs"
                                  title={model.id}
                                  translate="no"
                                >
                                  {model.id}
                                </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`${copied === model.id ? t.copied : t.copyId}: ${model.id}`}
                                  onClick={() => copyId(model.id)}
                                >
                                  {copied === model.id ? <Check /> : <Copy />}
                                </Button>
                              </ItemActions>
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
                    <Table className="min-w-[760px] tabular-nums">
                      <TableHeader>
                        <TableRow>
                          {columns.map(([key, label]) => (
                            <TableHead
                              key={key}
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
                                className="w-full justify-start"
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
                                {label}
                                {filters?.sort === key ? (
                                  filters.dir === "asc" ? (
                                    <ArrowUp data-icon="inline-end" />
                                  ) : (
                                    <ArrowDown data-icon="inline-end" />
                                  )
                                ) : (
                                  <ArrowUpDown data-icon="inline-end" />
                                )}
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
                                    {model.name || model.id}
                                  </TableCell>
                                  <TableCell className="max-w-56">
                                    <div className="flex min-w-0 items-center gap-1">
                                      <span
                                        className="min-w-0 truncate font-mono text-xs text-muted-foreground"
                                        title={model.id}
                                        translate="no"
                                      >
                                        {model.id}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`${copied === model.id ? t.copied : t.copyId}: ${model.id}`}
                                        title={
                                          copied === model.id
                                            ? t.copied
                                            : t.copyId
                                        }
                                        onClick={() => copyId(model.id)}
                                      >
                                        {copied === model.id ? (
                                          <Check />
                                        ) : (
                                          <Copy />
                                        )}
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono tabular-nums">
                                    {formatContext(model.context_length)}
                                  </TableCell>
                                  <TableCell className="font-mono tabular-nums">
                                    {input === 0 ? (
                                      <Badge variant="secondary">
                                        {t.free}
                                      </Badge>
                                    ) : (
                                      formatPrice(input)
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono tabular-nums">
                                    {output === 0 ? (
                                      <Badge variant="secondary">
                                        {t.free}
                                      </Badge>
                                    ) : (
                                      formatPrice(output)
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono tabular-nums">
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
        {copied ? `${t.copied}: ${copied}` : copyError}
      </span>
    </main>
  );
}
