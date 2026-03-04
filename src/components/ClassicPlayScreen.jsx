import QuestionCard from "./QuestionCard";
import MobileModeHeader from "./MobileModeHeader";

export default function ClassicPlayScreen({ onBack, onOpenRush, onOpenArena, questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen mobileModeScreen mobileClassicScreen">
      <MobileModeHeader
        heroClassName="mobileModeHeroClassic"
        onBack={onBack}
        pills={["Classique", "Progression"]}
        eyebrow="Session libre"
        title="Mode Classique"
        description="Travaille ton rythme, tes explications et ta progression sans chrono."
        actions={[
          { label: "Aller en Arena", onClick: onOpenArena },
          { label: "Passer en Rush", onClick: onOpenRush, primary: true },
        ]}
      />

      <div className="mobileModeQuestionWrap">
        <QuestionCard {...questionCardProps} compact />
      </div>
    </div>
  );
}
