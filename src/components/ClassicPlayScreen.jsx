import QuestionCard from "./QuestionCard";

export default function ClassicPlayScreen({ onBack, onOpenRush, onOpenArena, questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen">
      <div className="classicPlayTopbar classicModeBar">
        <button className="btn smooth hover-lift press" onClick={onBack}>
          Accueil
        </button>
        <div className="classicPlayTitleWrap">
          <div className="classicModeEyebrow">Session libre</div>
          <div className="classicPlayTitle">Mode Classique</div>
          <div className="small">Session libre, progression et defis</div>
        </div>
        <div className="classicPlayActions">
          <button className="btn smooth hover-lift press" onClick={onOpenArena}>
            Arene
          </button>
          <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenRush}>
            Rush
          </button>
        </div>
      </div>

      <QuestionCard {...questionCardProps} compact />
    </div>
  );
}
