import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./socket";
import "./index.css";

// 默认dark mode
if (typeof document !== "undefined") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
