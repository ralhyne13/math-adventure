import QuestionCard from "./QuestionCard";
import MobileModeHeader from "./MobileModeHeader";

export default function ClassicPlayScreen({ onBack, onOpenRush, onOpenArena, questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen mobileModeScreen mobileClassicScreen">
      <MobileModeHeader
        heroClassName="mobileModeHeroClassic"
        onBack={onBack}
        pills={["Classique", "Sans chrono"]}
        eyebrow="Jeu libre"
        title="Mode Classique"
        description="Une question a la fois, un rythme calme, et des effets ludiques."
        actions={[
          { label: "Passer en Rush", onClick: onOpenRush, primary: true },
        ]}
      />

      <div className="mobileModeQuestionWrap">
        <QuestionCard {...questionCardProps} compact />
      </div>
    </div>
  );
}
