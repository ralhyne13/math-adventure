export default function LandingPage({ onEnterApp }) {
  return (
    <div className="landingWrap">
      <section className="landingHero card smooth">
        <span className="landingBadge">Math Royale</span>
        <h1 className="landingTitle">Retrouve ton espace en un clic.</h1>
        <p className="landingLead">Lance l'app, connecte-toi, puis reprends directement tes mondes et ta progression.</p>
        <div className="toast" style={{ marginTop: 0 }}>
          <div>
            <strong>Acces rapide</strong>
            <div className="sub" style={{ marginTop: 6 }}>
              Pas d'etapes inutiles: entree directe vers l'ecran de connexion et le jeu.
            </div>
          </div>
        </div>
        <div className="landingCtas">
          <button className="btn btnPrimary smooth hover-lift press" onClick={onEnterApp}>
            Ouvrir l'app
          </button>
        </div>
        <div className="small">Version simple: progression, connexion et reprise rapide.</div>
      </section>
    </div>
  );
}
