import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initGA } from "./lib/analytics";

// GA 초기화
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (measurementId) {
  initGA(measurementId);
}

createRoot(document.getElementById("root")!).render(<App />);
