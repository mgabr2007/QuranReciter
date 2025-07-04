import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force cache clear - v2 audio system
console.log('Audio system fixed - v2');

createRoot(document.getElementById("root")!).render(<App />);
