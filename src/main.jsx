import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import LandingPage from "./components/LandingPage.jsx";

const LANDING_SEEN_KEY = "math-royale-landing-seen-v1";

function Root() {
  const [showApp, setShowApp] = useState(() => {
    const forceApp = window.location.hash === "#app";
    const seen = localStorage.getItem(LANDING_SEEN_KEY) === "1";
    return forceApp || seen;
  });

  function enterApp() {
    localStorage.setItem(LANDING_SEEN_KEY, "1");
    setShowApp(true);
  }

  if (!showApp) return <LandingPage onEnterApp={enterApp} />;
  return <App />;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
