import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const appearance = matchMedia("(prefers-color-scheme: dark)");
const syncAppearance = () => {
  document.documentElement.classList.toggle("dark", appearance.matches);
  document.documentElement.style.colorScheme = appearance.matches
    ? "dark"
    : "light";
};
syncAppearance();
appearance.addEventListener("change", syncAppearance);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
