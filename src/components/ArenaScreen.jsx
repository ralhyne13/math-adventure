import QuestionCard from "./QuestionCard";

export default function ArenaScreen({ onBack, onOpenRush, questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen arenaScreen mobileModeScreen mobileArenaScreen">
      <section className="classicPlayTopbar classicModeBar arenaModeBar mobileModeHero mobileModeHeroArena">
        <div className="mobileModeHeroTop">
          <button className="btn smooth hover-lift press" onClick={onBack}>
            Accueil
          </button>
          <div className="mobileModeHeroPills">
            <span className="pill">Arene</span>
            <span className="pill">Boss</span>
          </div>
        </div>

        <div className="classicPlayTitleWrap mobileModeTitleWrap">
          <div className="classicModeEyebrow">Combat continu</div>
          <div className="classicPlayTitle">Mode Arene</div>
          <div className="small">Serie longue, pression constante et boss toutes les 10 questions.</div>
        </div>

        <div className="classicPlayActions mobileModeActionGrid">
          <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenRush}>
            Basculer en Rush
          </button>
        </div>
      </section>

      <div className="mobileModeQuestionWrap">
        <QuestionCard {...questionCardProps} compact />
      </div>
    </div>
  );
}
