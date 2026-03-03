import QuestionCard from "./QuestionCard";

export default function ArenaScreen({ onBack, onOpenRush, questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen arenaScreen">
      <div className="classicPlayTopbar classicModeBar arenaModeBar">
        <button className="btn smooth hover-lift press" onClick={onBack}>
          Accueil
        </button>
        <div className="classicPlayTitleWrap">
          <div className="classicModeEyebrow">Combat continu</div>
          <div className="classicPlayTitle">Mode Arene</div>
          <div className="small">Serie infinie, boss toutes les 10 questions</div>
        </div>
        <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenRush}>
          Rush
        </button>
      </div>

      <QuestionCard {...questionCardProps} compact />
    </div>
  );
}
