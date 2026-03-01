import { useMemo, useState } from "react";
import { cloudPushBetaParent, isCloudEnabled, safeLSGet, safeLSSet } from "../storage";

const BETA_PARENTS_KEY = "math-royale-beta-parents-v1";

function getInitialForm() {
  return {
    parentName: "",
    email: "",
    childAge: "",
    notes: "",
  };
}

function saveBetaLocal(entry) {
  const rows = safeLSGet(BETA_PARENTS_KEY, []);
  const next = Array.isArray(rows) ? rows : [];
  next.unshift(entry);
  safeLSSet(BETA_PARENTS_KEY, next.slice(0, 300));
}

export default function LandingPage({ onEnterApp }) {
  const [form, setForm] = useState(getInitialForm);
  const [msg, setMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cloudEnabled = isCloudEnabled();

  const betaCount = useMemo(() => {
    const rows = safeLSGet(BETA_PARENTS_KEY, []);
    return Array.isArray(rows) ? rows.length : 0;
  }, [msg]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitBeta(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setMsg("");

    const parentName = String(form.parentName || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    const childAge = String(form.childAge || "").trim();
    const notes = String(form.notes || "").trim();

    if (parentName.length < 2) return setMsg("Nom parent trop court.");
    if (!email.includes("@")) return setMsg("Email invalide.");
    if (!childAge) return setMsg("Age enfant requis.");

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      parentName,
      email,
      childAge,
      notes,
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (cloudEnabled) {
        const pushed = await cloudPushBetaParent({ parentName, email, childAge, notes });
        if (!pushed) saveBetaLocal(entry);
      } else {
        saveBetaLocal(entry);
      }
    } finally {
      setIsSubmitting(false);
    }

    setForm(getInitialForm());
    setMsg(cloudEnabled ? "OK. Inscription beta enregistree." : "OK. Inscription beta locale enregistree.");
  }

  return (
    <div className="landingWrap">
      <section className="landingHero card smooth">
        <span className="landingBadge">Math Royale</span>
        <h1 className="landingTitle">Le jeu de maths qui donne envie de progresser.</h1>
        <p className="landingLead">Entrainement adaptatif, defis, mondes, boss et progression claire pour primaire + college.</p>
        <div className="landingCtas">
          <button className="btn btnPrimary smooth hover-lift press" onClick={onEnterApp}>
            Entrer dans l'app
          </button>
          <a className="btn smooth hover-lift press" href="#beta-parents">
            Rejoindre la beta parents
          </a>
        </div>
        <div className="landingStats">
          <span className="pill">Modes adaptatifs</span>
          <span className="pill">Mondes progressifs</span>
          <span className="pill">Beta parents: {betaCount}</span>
          <span className="pill">{cloudEnabled ? "Sync cloud active" : "Mode local"}</span>
        </div>
      </section>

      <section id="beta-parents" className="landingBeta card smooth">
        <div className="cardTitle">
          <span>Beta Test Parents</span>
          <span className="pill">Inscription rapide</span>
        </div>

        <form className="landingForm" onSubmit={submitBeta}>
          <input
            className="input smooth"
            placeholder="Nom du parent"
            value={form.parentName}
            onChange={(e) => updateField("parentName", e.target.value)}
          />
          <input
            className="input smooth"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
          <input
            className="input smooth"
            placeholder="Age de l'enfant (ex: 8)"
            value={form.childAge}
            onChange={(e) => updateField("childAge", e.target.value)}
          />
          <textarea
            className="input smooth landingTextarea"
            placeholder="Objectif (tables, fractions, confiance...)"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          {msg && <div className={msg.startsWith("OK.") ? "authMsg authMsgOk" : "authMsg"}>{msg}</div>}

          <div className="landingFormActions">
            <button className="btn btnPrimary smooth hover-lift press" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi..." : "Rejoindre la beta"}
            </button>
            <button className="btn smooth hover-lift press" type="button" onClick={onEnterApp}>
              Aller au jeu
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

