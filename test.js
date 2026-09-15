const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("i18n.js", "utf8");
const checks = `
  t = I18N.en;
  if (optionLabel("repetition_penalty") !== "Repetition Penalty") throw new Error("English parameter label");
  if (optionLabel("future_parameter") !== "Future Parameter") throw new Error("Unknown parameter fallback");
  t = I18N["zh-CN"];
  if (optionLabel("repetition_penalty") !== "重复惩罚") throw new Error("Simplified Chinese parameter label");
  if (optionLabel("image") !== "图像") throw new Error("Simplified Chinese modality label");
  t = I18N["zh-TW"];
  if (optionLabel("video") !== "影片") throw new Error("Traditional Chinese modality label");
`;

vm.runInNewContext(source + checks, {
  navigator: { languages: ["en"] },
  localStorage: { getItem: () => null },
});
