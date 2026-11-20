import { useEffect, useState } from "react";
import "../../styles/components/privacy-guard.css";

/**
 * Browser-level privacy shield.
 * This obscures the workspace when the tab is hidden or the browser window
 * loses focus. It cannot detect or block operating-system screenshots.
 */
export default function PrivacyGuard({ enabled, children }) {
  const [obscured, setObscured] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setObscured(false);
      return undefined;
    }

    const obscure = () => setObscured(true);
    const reveal = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        setObscured(false);
      }
    };

    document.addEventListener("visibilitychange", reveal);
    window.addEventListener("blur", obscure);
    window.addEventListener("focus", reveal);
    window.addEventListener("pageshow", reveal);
    window.addEventListener("pagehide", obscure);

    if (document.visibilityState !== "visible") setObscured(true);

    return () => {
      document.removeEventListener("visibilitychange", reveal);
      window.removeEventListener("blur", obscure);
      window.removeEventListener("focus", reveal);
      window.removeEventListener("pageshow", reveal);
      window.removeEventListener("pagehide", obscure);
    };
  }, [enabled]);

  return (
    <div className={enabled ? "lm-privacy-guard-enabled" : undefined}>
      {children}
      {enabled && obscured && (
        <div className="lm-privacy-shield" role="status" aria-live="polite">
          <div className="lm-privacy-shield-card">
            <span className="lm-privacy-shield-icon" aria-hidden="true">🔒</span>
            <strong>Luminest Privacy Protection</strong>
            <p>Sensitive workspace information is hidden while this window is inactive.</p>
            <span>Return to this window to continue.</span>
          </div>
        </div>
      )}
    </div>
  );
}
