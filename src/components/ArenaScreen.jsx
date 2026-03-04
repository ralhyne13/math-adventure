import QuestionCard from "./QuestionCard";
import MobileModeHeader from "./MobileModeHeader";

export default function ArenaScreen({ onBack, onOpenRush, questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen arenaScreen mobileModeScreen mobileArenaScreen">
      <MobileModeHeader
        heroClassName="arenaModeBar mobileModeHeroArena"
        onBack={onBack}
        pills={["Arena", "Boss"]}
        eyebrow="Combat continu"
        title="Mode Arena"
        description="Serie longue, pression constante et boss toutes les 10 questions."
        actions={[{ label: "Basculer en Rush", onClick: onOpenRush, primary: true }]}
      />

      <div className="mobileModeQuestionWrap">
        <QuestionCard {...questionCardProps} compact />
      </div>
    </div>
  );
}
