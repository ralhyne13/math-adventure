import QuestionCard from "./QuestionCard";

export default function ClassicPlayScreen({ onBack, onOpenRush, onOpenArena, questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen mobileModeScreen mobileClassicScreen">
      <section className="classicPlayTopbar classicModeBar mobileModeHero mobileModeHeroClassic">
        <div className="mobileModeHeroTop">
          <button className="btn smooth hover-lift press" onClick={onBack}>
            Accueil
          </button>
          <div className="mobileModeHeroPills">
            <span className="pill">Classique</span>
            <span className="pill">Progression</span>
          </div>
        </div>

        <div className="classicPlayTitleWrap mobileModeTitleWrap">
          <div className="classicModeEyebrow">Session libre</div>
          <div className="classicPlayTitle">Mode Classique</div>
          <div className="small">Travaille ton rythme, tes explications et ta progression sans chrono.</div>
        </div>

        <div className="classicPlayActions mobileModeActionGrid">
          <button className="btn smooth hover-lift press" onClick={onOpenArena}>
            Aller en Arene
          </button>
          <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenRush}>
            Passer en Rush
          </button>
        </div>
      </section>

      <div className="mobileModeQuestionWrap">
        <QuestionCard {...questionCardProps} compact />
      </div>
    </div>
  );
}
