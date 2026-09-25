// ── Filter ─────────────────────────────────────────────────────────
function applyFilter() {
  const ctxMin = +dom.ctxMin.value;
  const ctxMax = +dom.ctxMax.value;
  const inMin = +dom.inPriceMin.value;
  const inMax = +dom.inPriceMax.value;
  const outMin = +dom.outPriceMin.value;
  const outMax = +dom.outPriceMax.value;
  const checkedInMods = [
    ...document.querySelectorAll(".input-modality-cb:checked"),
  ].map((el) => el.value);
  const checkedOutMods = [
    ...document.querySelectorAll(".output-modality-cb:checked"),
  ].map((el) => el.value);
  const checkedParams = [...document.querySelectorAll(".param-cb:checked")].map(
    (el) => el.value,
  );

  const filtered = allModels.filter((m) => {
    const inputMods =
      m.architecture?.input_modalities || m.input_modalities || [];
    const outputMods =
      m.architecture?.output_modalities || m.output_modalities || [];
    if (checkedInMods.length > 0) {
      for (const mod of checkedInMods) {
        if (!inputMods.includes(mod)) return false;
      }
    }
    if (checkedOutMods.length > 0) {
      for (const mod of checkedOutMods) {
        if (!outputMods.includes(mod)) return false;
      }
    }

    const modelParams = m.supported_parameters || [];
    if (checkedParams.length > 0) {
      for (const p of checkedParams) {
        if (!modelParams.includes(p)) return false;
      }
    }

    const ctx = m.context_length;
    if (ctx != null) {
      if (ctx < ctxMin) return false;
      if (ctxMax !== Infinity && ctx > ctxMax) return false;
    }

    const pPrompt = pricePerMillion((m.pricing || {}).prompt);
    const pComp = pricePerMillion((m.pricing || {}).completion);

    if (pPrompt !== null) {
      if (pPrompt < inMin) return false;
      if (inMax !== Infinity && pPrompt > inMax) return false;
    }
    if (pComp !== null) {
      if (pComp < outMin) return false;
      if (outMax !== Infinity && pComp > outMax) return false;
    }

    return true;
  });

  dom.count.textContent = filtered.length;
  renderTable(sortFiltered(filtered));
  saveFilterState();
}

// ── URL state ─────────────────────────────────────────────────────
function saveFilterState() {
  const p = new URLSearchParams();
  if (dom.ctxMin) p.set("ctxMin", dom.ctxMin.value);
  if (dom.ctxMax) p.set("ctxMax", dom.ctxMax.value);
  if (dom.inPriceMin) p.set("inMin", dom.inPriceMin.value);
  if (dom.inPriceMax) p.set("inMax", dom.inPriceMax.value);
  if (dom.outPriceMin) p.set("outMin", dom.outPriceMin.value);
  if (dom.outPriceMax) p.set("outMax", dom.outPriceMax.value);
  const checkedIn = [
    ...document.querySelectorAll(".input-modality-cb:checked"),
  ].map((el) => el.value);
  if (checkedIn.length) p.set("inMods", checkedIn.join(","));
  const checkedOut = [
    ...document.querySelectorAll(".output-modality-cb:checked"),
  ].map((el) => el.value);
  if (checkedOut.length) p.set("outMods", checkedOut.join(","));
  const checked = [...document.querySelectorAll(".param-cb:checked")].map(
    (el) => el.value,
  );
  if (checked.length) p.set("params", checked.join(","));
  location.hash = p.toString();
}

function loadFilterState() {
  const p = new URLSearchParams(location.hash.slice(1));
  const setVal = (id, key) => {
    if (p.has(key) && dom[id]) dom[id].value = p.get(key);
  };
  setVal("ctxMin", "ctxMin");
  setVal("ctxMax", "ctxMax");
  setVal("inPriceMin", "inMin");
  setVal("inPriceMax", "inMax");
  setVal("outPriceMin", "outMin");
  setVal("outPriceMax", "outMax");
  if (p.has("inMods")) {
    const checked = new Set(p.get("inMods").split(","));
    document.querySelectorAll(".input-modality-cb").forEach((el) => {
      el.checked = checked.has(el.value);
    });
  }
  if (p.has("outMods")) {
    const checked = new Set(p.get("outMods").split(","));
    document.querySelectorAll(".output-modality-cb").forEach((el) => {
      el.checked = checked.has(el.value);
    });
  }
  if (p.has("params")) {
    const checked = new Set(p.get("params").split(","));
    document.querySelectorAll(".param-cb").forEach((el) => {
      el.checked = checked.has(el.value);
    });
  }
}

// ── Sort ───────────────────────────────────────────────────────────
function sortFiltered(list) {
  return list.slice().sort((a, b) => {
    let va, vb;
    switch (sortField) {
      case "name":
        va = a.name || "";
        vb = b.name || "";
        break;
      case "id":
        va = a.id || "";
        vb = b.id || "";
        break;
      case "context":
        va = a.context_length;
        vb = b.context_length;
        break;
      case "prompt":
        va = pricePerMillion((a.pricing || {}).prompt);
        vb = pricePerMillion((b.pricing || {}).prompt);
        break;
      case "completion":
        va = pricePerMillion((a.pricing || {}).completion);
        vb = pricePerMillion((b.pricing || {}).completion);
        break;
      case "maxOutput":
        va = a.top_provider?.max_completion_tokens ?? 0;
        vb = b.top_provider?.max_completion_tokens ?? 0;
        break;
    }
    if (typeof va === "string") return sortDir * va.localeCompare(vb);
    if (va == null) va = Infinity;
    if (vb == null) vb = Infinity;
    return sortDir * (va - vb);
  });
}

function updateSortIndicators() {
  document.querySelectorAll("th .sort").forEach((el) => {
    const active = el.id === `s-${sortField}`;
    el.classList.toggle("active", active);
    el.textContent = active && sortDir === -1 ? "▼" : "▲";
  });
}

function sortBy(field) {
  if (sortField === field) sortDir = -sortDir;
  else {
    sortField = field;
    sortDir = 1;
  }

  updateSortIndicators();
  applyFilter();
}

function copyWithLegacyApi(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  let copied = false;
  try {
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    copied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }

  if (!copied) throw new Error("Clipboard copy failed");
}

async function copyModelId(button) {
  const id = button.dataset.copyId;
  if (!id) return;

  try {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(id);
    } catch {
      copyWithLegacyApi(id);
    }

    button.classList.add("is-copied");
    button.setAttribute("aria-label", t.copied);
    button.title = t.copied;
    window.setTimeout(() => {
      if (!button.isConnected) return;
      button.classList.remove("is-copied");
      button.setAttribute("aria-label", t.copyId);
      button.title = t.copyId;
    }, 1200);
  } catch (e) {
    console.error("Unable to copy model ID", e);
  }
}

// ── Table ──────────────────────────────────────────────────────────
function renderTable(filtered) {
  const tbody = dom.tbody;
  const rows = filtered.map((m) => {
    const pPrompt = pricePerMillion((m.pricing || {}).prompt);
    const pComp = pricePerMillion((m.pricing || {}).completion);
    const promptStr =
      pPrompt === 0
        ? `<span class="free">${esc(t.free)}</span>`
        : pPrompt === null
          ? '<span class="muted-value">--</span>'
          : "$" + fmtPrice(pPrompt);
    const compStr =
      pComp === 0
        ? `<span class="free">${esc(t.free)}</span>`
        : pComp === null
          ? '<span class="muted-value">--</span>'
          : "$" + fmtPrice(pComp);
    return `<tr>
      <td>${esc(m.name)}</td>
      <td class="id-cell">
        <div class="id-content">
          <span class="id-value" title="${esc(m.id)}">${esc(m.id)}</span>
          <button
            class="button button-ghost button-icon copy-id"
            type="button"
            data-copy-id="${esc(m.id)}"
            aria-label="${esc(t.copyId)}"
            title="${esc(t.copyId)}"
          >
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
            </svg>
            <svg class="check-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12 4 4L19 6"></path>
            </svg>
          </button>
        </div>
      </td>
      <td class="context">${fmtCtx(m.context_length)}</td>
      <td class="price">${promptStr}</td>
      <td class="price">${compStr}</td>
      <td class="context">${fmtCtx(m.top_provider?.max_completion_tokens)}</td>
    </tr>`;
  });
  tbody.innerHTML = rows.join("");
}

// ── Select builders ────────────────────────────────────────────────
function buildContextSelects() {
  const ctxSet = new Set(
    allModels.map((m) => m.context_length).filter(Boolean),
  );
  const ctxSorted = [...ctxSet].sort((a, b) => a - b);
  const unlimitedText = esc(t.unlimited);
  const opts = ctxSorted
    .map((n) => `<option value="${n}">${fmtCtx(n)}</option>`)
    .join("");

  dom.ctxMin.innerHTML = `<option value="0">${unlimitedText}</option>` + opts;
  dom.ctxMax.innerHTML =
    opts + `<option value="Infinity">${unlimitedText}</option>`;

  const def =
    ctxSorted.find((n) => n >= 256000) ||
    ctxSorted[Math.floor(ctxSorted.length / 2)];
  dom.ctxMin.value = def;
  dom.ctxMax.value = "Infinity";
}

function buildPriceSelects() {
  const rawPrices = [];
  allModels.forEach((m) => {
    const pp = pricePerMillion((m.pricing || {}).prompt);
    const pc = pricePerMillion((m.pricing || {}).completion);
    if (pp !== null) rawPrices.push(pp);
    if (pc !== null) rawPrices.push(pc);
  });
  const deduped = [...new Set(rawPrices.map((n) => round2(n)))].sort(
    (a, b) => a - b,
  );
  const makeOpt = (n) => `<option value="${n}">$${fmtPrice(n)}/M</option>`;
  const opts = deduped.map(makeOpt).join("");
  const hasFree = deduped.includes(0);
  const minOpt = hasFree ? opts : makeOpt(0) + opts;
  const unlimitedText = esc(t.unlimited);

  ["inPriceMin", "outPriceMin"].forEach((id) => (dom[id].innerHTML = minOpt));
  ["inPriceMax", "outPriceMax"].forEach(
    (id) =>
      (dom[id].innerHTML =
        opts + `<option value="Infinity">${unlimitedText}</option>`),
  );

  const firstPaid = deduped.find((n) => n > 0) || 0;
  dom.inPriceMin.value = firstPaid;
  dom.outPriceMin.value = firstPaid;
  dom.inPriceMax.value = "Infinity";
  dom.outPriceMax.value = "Infinity";
}

function buildParamCheckboxes() {
  const allParams = new Set();
  allModels.forEach((m) =>
    (m.supported_parameters || []).forEach((p) => allParams.add(p)),
  );
  const sorted = [...allParams].sort();

  dom.paramsBody.innerHTML = sorted
    .map(
      (p) =>
        `<label><input type="checkbox" class="param-cb" value="${esc(p)}"${p === "tools" ? " checked" : ""}> <span data-option-value="${esc(p)}">${esc(optionLabel(p))}</span></label>`,
    )
    .join("");

  dom.paramCount.textContent = `(${sorted.length})`;
}

function buildModalityCheckboxes() {
  const inputMods = new Set();
  const outputMods = new Set();
  allModels.forEach((m) => {
    const im = m.architecture?.input_modalities || m.input_modalities || [];
    const om = m.architecture?.output_modalities || m.output_modalities || [];
    im.forEach((mod) => inputMods.add(mod));
    om.forEach((mod) => outputMods.add(mod));
  });

  const sortedIn = [...inputMods].sort();
  const sortedOut = [...outputMods].sort();

  dom.inputModalityBody.innerHTML = sortedIn
    .map(
      (mod) =>
        `<label><input type="checkbox" class="input-modality-cb" value="${esc(mod)}"${mod === "text" ? " checked" : ""}> <span data-option-value="${esc(mod)}">${esc(optionLabel(mod))}</span></label>`,
    )
    .join("");

  dom.outputModalityBody.innerHTML = sortedOut
    .map(
      (mod) =>
        `<label><input type="checkbox" class="output-modality-cb" value="${esc(mod)}"${mod === "text" ? " checked" : ""}> <span data-option-value="${esc(mod)}">${esc(optionLabel(mod))}</span></label>`,
    )
    .join("");
}

// ── Event binding ──────────────────────────────────────────────────
function bindEvents() {
  dom.langSelect.addEventListener("change", () =>
    switchLang(dom.langSelect.value),
  );

  [
    "ctxMin",
    "ctxMax",
    "inPriceMin",
    "inPriceMax",
    "outPriceMin",
    "outPriceMax",
  ].forEach((id) => dom[id].addEventListener("change", applyFilter));

  dom.inputModalityBody.addEventListener("change", applyFilter);
  dom.outputModalityBody.addEventListener("change", applyFilter);

  dom.thead.addEventListener("click", (e) => {
    const th = e.target.closest("th[data-sort]");
    if (!th) return;
    sortBy(th.dataset.sort);
  });

  // Delegate change events for dynamically-built parameter checkboxes
  dom.paramsBody.addEventListener("change", applyFilter);

  // Delegate copy actions for dynamically-rendered model IDs
  dom.tbody.addEventListener("click", (e) => {
    const button = e.target.closest("button.copy-id");
    if (!button) return;
    copyModelId(button);
  });

  window.addEventListener("hashchange", () => {
    loadFilterState();
    applyFilter();
  });
}

// ── Init ───────────────────────────────────────────────────────────
async function load() {
  cacheDom();
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models");
    const j = await r.json();
    allModels = (j.data || j).filter((m) => !m.id.startsWith("openrouter/"));

    updateCounts();
    buildContextSelects();
    buildPriceSelects();
    buildParamCheckboxes();
    buildModalityCheckboxes();
    loadFilterState();
    bindEvents();
    updateSortIndicators();
    applyI18n();
  } catch (e) {
    dom.tbody.innerHTML = `<tr><td colspan="6" class="error">${t.loadFailed}: ${esc(e.message)}</td></tr>`;
  }
}

load();
