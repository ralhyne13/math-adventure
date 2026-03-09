import QuestionCard from "./QuestionCard";

export default function ArenaScreen({ questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen arenaScreen mobileModeScreen mobileArenaScreen">
      <div className="mobileModeQuestionWrap">
        <QuestionCard {...questionCardProps} compact />
      </div>
    </div>
  );
}
