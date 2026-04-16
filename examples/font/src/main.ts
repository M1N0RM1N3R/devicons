import "devicons/css";
import { mountApp } from "./App";

const root = document.getElementById("app");
if (!root) throw new Error("#app element not found");
mountApp(root);
