import Modal from "./Modal";

export default function Settings({
  show,
  onClose,
  presentation = "modal",
  audioOn,
  setAudioOn,
  fxVolume,
  setFxVolume,
  vibrateOn,
  setVibrateOn,
  autoNextOn,
  setAutoNextOn,
  autoNextMs,
  setAutoNextMs,
  reduceMotion,
  setReduceMotion,
  skinAnimated,
  adaptiveOn,
  setAdaptiveOn,
  noPenaltyOnWrong,
  setNoPenaltyOnWrong,
  pwCurrent,
  setPwCurrent,
  pwChangeNew,
  setPwChangeNew,
  pwChangeNew2,
  setPwChangeNew2,
  pwChangeMsg,
  changePasswordLoggedIn,
}) {
  if (!show) return null;

  const isMobilePage = presentation === "page";
  const modalTitle = "Reglages";

  return (
    <Modal title={modalTitle} onClose={onClose} presentation={presentation}>
      <div className={`panelSectionStack ${isMobilePage ? "mobilePanelStack" : ""}`}>
        {isMobilePage && (
          <section className="panelCard mobilePageHeroCard">
            <div className="mobileSectionEyebrow">Configuration</div>
            <div className="mobileSectionTitle">Adapte l'experience mobile</div>
            <div className="small" style={{ marginTop: 8 }}>
              Ajuste le rythme, l'accessibilite et la securite sans sortir du parcours mobile.
            </div>
          </section>
        )}

        <div className={`shopCard panelCard settingsPanelCard ${isMobilePage ? "mobileSettingsCard" : ""}`}>
          <div className="settingsSectionTitle">Audio et vibrations</div>
          <div className="settingsToggleList">
            <label className="settingsRow">
              <span>Sons</span>
              <input type="checkbox" checked={audioOn} onChange={(e) => setAudioOn(e.target.checked)} />
            </label>
            <div className="small" style={{ marginTop: 8 }}>
              Volume FX: {Math.round((Number(fxVolume) || 0) * 100)}%
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={fxVolume}
              onChange={(e) => setFxVolume(Number(e.target.value))}
              style={{ width: "100%", marginTop: 8 }}
            />
            <label className="settingsRow">
              <span>Vibrations (mobile)</span>
              <input type="checkbox" checked={vibrateOn} onChange={(e) => setVibrateOn(e.target.checked)} />
            </label>
          </div>
        </div>

        <div className={`shopCard panelCard settingsPanelCard ${isMobilePage ? "mobileSettingsCard" : ""}`}>
          <div className="settingsSectionTitle">Rythme</div>
          <label className="settingsRow">
            <span>Auto-suivant apres explication</span>
            <input type="checkbox" checked={autoNextOn} onChange={(e) => setAutoNextOn(e.target.checked)} />
          </label>
          <div className="small" style={{ marginTop: 8 }}>Delai (ms) : {autoNextMs}</div>
          <input
            type="range"
            min={600}
            max={6000}
            step={200}
            value={autoNextMs}
            onChange={(e) => setAutoNextMs(Number(e.target.value))}
            style={{ width: "100%", marginTop: 8 }}
          />
        </div>

        <div className={`shopCard panelCard settingsPanelCard ${isMobilePage ? "mobileSettingsCard" : ""}`}>
          <div className="settingsSectionTitle">Accessibilite</div>
          <label className="settingsRow">
            <span>Reduire les animations</span>
            <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
          </label>
          <div className="small" style={{ marginTop: 8 }}>
            Skins animes : {skinAnimated ? <b>disponible</b> : <b>skin statique</b>} (desactive si reduction active)
          </div>
        </div>

        <div className={`shopCard panelCard settingsPanelCard ${isMobilePage ? "mobileSettingsCard" : ""}`}>
          <div className="settingsSectionTitle">Apprentissage adaptatif</div>
          <label className="settingsRow">
            <span>Activer le mode adaptatif</span>
            <input type="checkbox" checked={adaptiveOn} onChange={(e) => setAdaptiveOn(e.target.checked)} />
          </label>
          <div className="small" style={{ marginTop: 8 }}>
            Sur 20 reponses : plus de 85% = difficulte +1, moins de 55% = difficulte -1 avec entrainement cible.
          </div>
        </div>

        <div className={`shopCard panelCard settingsPanelCard ${isMobilePage ? "mobileSettingsCard" : ""}`}>
          <div className="settingsSectionTitle">Jeunes joueurs</div>
          <label className="settingsRow">
            <span>Sans malus (pas de -1 coin en erreur)</span>
            <input type="checkbox" checked={noPenaltyOnWrong} onChange={(e) => setNoPenaltyOnWrong(e.target.checked)} />
          </label>
          <div className="small" style={{ marginTop: 8 }}>
            Recommande pour CP/CE1 : l'erreur ne retire aucune piece.
          </div>
        </div>

        <div className={`shopCard panelCard settingsPanelCard ${isMobilePage ? "mobileSettingsCard" : ""}`}>
          <div className="settingsSectionTitle">Securite</div>
          <div className="small" style={{ marginBottom: 10 }}>Changer ton mot de passe (stocke hache en local).</div>
          <div className={`mobileSettingsForm ${isMobilePage ? "mobileSettingsFormRefresh" : ""}`} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <input className="input smooth" placeholder="Mot de passe actuel" type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} />
            <input className="input smooth" placeholder="Nouveau mot de passe" type="password" value={pwChangeNew} onChange={(e) => setPwChangeNew(e.target.value)} />
            <input className="input smooth" placeholder="Confirmer nouveau mot de passe" type="password" value={pwChangeNew2} onChange={(e) => setPwChangeNew2(e.target.value)} />
            {pwChangeMsg && <div className={pwChangeMsg.startsWith("OK") ? "authMsg authMsgOk" : "authMsg"}>{pwChangeMsg}</div>}
            <button className="btn btnPrimary smooth hover-lift press" onClick={changePasswordLoggedIn}>
              Mettre a jour
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
