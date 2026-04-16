import "@dev.icons/core/font/css";
import spriteUrl from "@dev.icons/core/sprite?url";
import { mountApp } from "./App";

const root = document.getElementById("app");
if (!root) throw new Error("#app element not found");
mountApp(root, spriteUrl);
