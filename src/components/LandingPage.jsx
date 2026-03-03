export default function LandingPage({ onEnterApp }) {
  return (
    <div className="landingWrap">
      <section className="landingHero card smooth">
        <span className="landingBadge">Math Royale</span>
        <h1 className="landingTitle">Un jeu de maths simple, clair et motivant.</h1>
        <p className="landingLead">Entraîne-toi à ton rythme, progresse par mondes, puis retrouve ta partie en un clic.</p>
        <div className="landingCtas">
          <button className="btn btnPrimary smooth hover-lift press" onClick={onEnterApp}>
            Entrer dans l'app
          </button>
        </div>
        <div className="landingStats">
          <span className="pill">Progression claire</span>
          <span className="pill">Défis adaptés</span>
          <span className="pill">Mode local simple</span>
        </div>
      </section>
    </div>
  );
}
