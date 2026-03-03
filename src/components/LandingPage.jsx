export default function LandingPage({ onEnterApp }) {
  return (
    <div className="landingWrap">
      <section className="landingHero card smooth landingHeroRefresh">
        <div className="landingHeroGrid">
          <div>
            <span className="landingBadge">Math Royale</span>
            <h1 className="landingTitle">Une aventure de maths plus claire, plus rapide, plus lisible.</h1>
            <p className="landingLead">Entre dans l'app, retrouve ton profil et repars directement sur ton monde en cours.</p>
            <div className="landingStats">
              <span className="pill">Mondes progressifs</span>
              <span className="pill">Questions rapides</span>
              <span className="pill">Reprise instantanee</span>
            </div>
          </div>

          <div className="landingHeroSide">
            <div className="landingFeatureCard">
              <div className="landingFeatureEyebrow">Acces direct</div>
              <div className="landingFeatureTitle">Une entree simple</div>
              <div className="small">Pas d'ecran parasite: tu vas droit vers la connexion puis le jeu.</div>
            </div>

            <div className="landingCtas">
              <button className="btn btnPrimary smooth hover-lift press" onClick={onEnterApp}>
                Entrer dans l'app
              </button>
            </div>

            <div className="small">Version locale ou cloud, progression conservee.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
