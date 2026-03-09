import QuestionCard from "./QuestionCard";

export default function ClassicPlayScreen({ questionCardProps }) {
  return (
    <div className="appFrame classicPlayScreen mobileModeScreen mobileClassicScreen">
      <div className="mobileModeQuestionWrap">
        <QuestionCard {...questionCardProps} compact />
      </div>
    </div>
  );
}
