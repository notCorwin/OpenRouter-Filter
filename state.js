// ── State ──────────────────────────────────────────────────────────
let allModels = [];
let sortField = "completion";
let sortDir = 1;

// ── DOM refs (cached once) ────────────────────────────────────────
const dom = {};
function cacheDom() {
  const ids = [
    "langSelect",
    "ctxMin",
    "ctxMax",
    "inPriceMin",
    "inPriceMax",
    "outPriceMin",
    "outPriceMax",
    "paramsBody",
    "paramCount",
    "count",
    "totalCount",
    "tbody",
    "inputModalityBody",
    "outputModalityBody",
  ];
  ids.forEach((id) => (dom[id] = document.getElementById(id)));
  dom.thead = document.querySelector("thead");
}
