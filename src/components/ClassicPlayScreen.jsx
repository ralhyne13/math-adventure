import QuestionCard from "./QuestionCard";

export default function ClassicPlayScreen({ onBack, onOpenRush, questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen">
      <div className="classicPlayTopbar">
        <button className="btn smooth hover-lift press" onClick={onBack}>
          Accueil
        </button>
        <div className="classicPlayTitleWrap">
          <div className="classicPlayTitle">Mode Classique</div>
          <div className="small">Session libre, progression et défis</div>
        </div>
        <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenRush}>
          ⚡ Rush
        </button>
      </div>

      <QuestionCard {...questionCardProps} compact />
    </div>
  );
}
