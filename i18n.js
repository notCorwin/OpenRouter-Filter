// ── Locales ───────────────────────────────────────────────────────
const LOCALES = {
  en: "English",
  "zh-CN": "简体中文",
};

const DEFAULT_LOCALE = "en";

// ── Translation table ─────────────────────────────────────────────
const I18N = {
  en: {
    title: "OpenRouter Model Filter",
    contextLabel: "Context",
    inPriceLabel: "Input price",
    outPriceLabel: "Output price",
    inputModalityLabel: "Input modalities",
    outputModalityLabel: "Output modalities",
    paramsLabel: "Supported params",
    selectAll: "Select all",
    clearAll: "Clear",
    matched: "Matched",
    models: "models",
    loading: "Loading...",
    unlimited: "Unlimited",
    free: "Free",
    colName: "Name",
    colContext: "Context",
    colInputPrice: "Input price",
    colOutputPrice: "Output price",
    colMaxOutput: "Max Output",
    loadFailed: "Load failed",
    copyId: "Copy ID",
    copied: "Copied",
    optionLabels: {
      audio: "Audio",
      file: "File",
      image: "Image",
      text: "Text",
      video: "Video",
      frequency_penalty: "Frequency Penalty",
      include_reasoning: "Include Reasoning",
      logit_bias: "Logit Bias",
      logprobs: "Log Probabilities",
      max_completion_tokens: "Max Completion Tokens",
      max_tokens: "Max Tokens",
      min_p: "Min P",
      parallel_tool_calls: "Parallel Tool Calls",
      prediction: "Prediction",
      presence_penalty: "Presence Penalty",
      reasoning: "Reasoning",
      reasoning_effort: "Reasoning Effort",
      repetition_penalty: "Repetition Penalty",
      response_format: "Response Format",
      seed: "Random Seed",
      stop: "Stop Sequences",
      structured_outputs: "Structured Outputs",
      temperature: "Temperature",
      tool_choice: "Tool Choice",
      tools: "Tools",
      top_a: "Top A",
      top_k: "Top K",
      top_logprobs: "Top Log Probabilities",
      top_p: "Top P",
      verbosity: "Verbosity",
      web_search_options: "Web Search Options",
    },
  },
  "zh-CN": {
    title: "OpenRouter 模型筛选",
    contextLabel: "上下文",
    inPriceLabel: "输入价格",
    outPriceLabel: "输出价格",
    inputModalityLabel: "输入模态",
    outputModalityLabel: "输出模态",
    paramsLabel: "支持的参数",
    selectAll: "全选",
    clearAll: "清空",
    matched: "匹配",
    models: "个模型",
    loading: "加载中...",
    unlimited: "不限",
    free: "免费",
    colName: "名称",
    colContext: "上下文",
    colInputPrice: "输入价格",
    colOutputPrice: "输出价格",
    colMaxOutput: "最大输出",
    loadFailed: "加载失败",
    copyId: "复制 ID",
    copied: "已复制",
    optionLabels: {
      audio: "音频",
      file: "文件",
      image: "图像",
      text: "文本",
      video: "视频",
      frequency_penalty: "频率惩罚",
      include_reasoning: "包含推理过程",
      logit_bias: "Logit 偏置",
      logprobs: "对数概率",
      max_completion_tokens: "最大补全令牌数",
      max_tokens: "最大令牌数",
      min_p: "最小 P 值",
      parallel_tool_calls: "并行工具调用",
      prediction: "预测内容",
      presence_penalty: "存在惩罚",
      reasoning: "推理",
      reasoning_effort: "推理强度",
      repetition_penalty: "重复惩罚",
      response_format: "响应格式",
      seed: "随机种子",
      stop: "停止序列",
      structured_outputs: "结构化输出",
      temperature: "温度",
      tool_choice: "工具选择",
      tools: "工具",
      top_a: "Top A",
      top_k: "Top K",
      top_logprobs: "最高对数概率",
      top_p: "Top P",
      verbosity: "详细程度",
      web_search_options: "网络搜索选项",
    },
  },
};

// ── Safe localStorage helpers ──────────────────────────────────────
function getStoredLang() {
  try {
    return localStorage.getItem("or_filter_lang");
  } catch {
    return null;
  }
}
function setStoredLang(code) {
  try {
    localStorage.setItem("or_filter_lang", code);
  } catch {
    /* noop */
  }
}

// ── Locale resolution ─────────────────────────────────────────────
function detectLocale() {
  const stored = getStoredLang();
  if (stored && I18N[stored]) return stored;

  const langs = navigator.languages || [navigator.language || DEFAULT_LOCALE];
  for (const raw of langs) {
    const lang = raw.replace(/_/g, "-");
    if (I18N[lang]) return lang;
    const prefix = lang.split("-")[0];
    const candidates = Object.keys(I18N).filter(
      (k) => k.startsWith(prefix + "-") || k === prefix,
    );
    if (candidates.length > 0) return candidates[0];
  }
  return DEFAULT_LOCALE;
}

let LOCALE = detectLocale();
let t = I18N[LOCALE] || I18N[DEFAULT_LOCALE];

// ── i18n helpers ───────────────────────────────────────────────────
function optionLabel(value) {
  return (
    t.optionLabels?.[value] ||
    I18N.en.optionLabels[value] ||
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });
  const html = document.documentElement;
  html.lang = LOCALE;

  dom.langSelect.innerHTML = Object.keys(LOCALES)
    .map(
      (code) =>
        `<option value="${code}"${code === LOCALE ? " selected" : ""}>${LOCALES[code]}</option>`,
    )
    .join("");

  document.title = t.title || "OpenRouter Model Filter";

  document.querySelectorAll("[data-option-value]").forEach((el) => {
    el.textContent = optionLabel(el.dataset.optionValue);
  });

  if (allModels.length > 0) {
    // Preserve user's filter values before rebuilding translated selects
    const selIds = [
      "ctxMin",
      "ctxMax",
      "inPriceMin",
      "inPriceMax",
      "outPriceMin",
      "outPriceMax",
    ];
    const saved = {};
    selIds.forEach((id) => {
      if (dom[id]) saved[id] = dom[id].value;
    });

    updateCounts();
    buildContextSelects();
    buildPriceSelects();

    selIds.forEach((id) => {
      if (dom[id] && saved[id] !== undefined) dom[id].value = saved[id];
    });
    applyFilter();
  }
}

function switchLang(code) {
  if (!I18N[code]) return;
  LOCALE = code;
  t = I18N[code];
  setStoredLang(code);
  applyI18n();
}
