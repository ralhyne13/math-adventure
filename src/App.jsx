import { useState } from "react";
import "./index.css";

function Fraction({ num, den }) {
  return (
    <div className="fraction">
      <span>{num}</span>
      <span>{den}</span>
    </div>
  );
}

export default function App() {
  const [num1] = useState(1);
  const [den1] = useState(2);
  const [num2] = useState(3);
  const [den2] = useState(4);

  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);

  const checkAnswer = () => {
    const value1 = num1 / den1;
    const value2 = num2 / den2;

    let correctSymbol = value1 > value2 ? ">" : value1 < value2 ? "<" : "=";

    if (answer === correctSymbol) {
      setResult("correct");
    } else {
      setResult("wrong");
    }
  };

  return (
    <div className="container">
      <div className={`card glass smooth ${result === "correct" ? "correct pulse-ok" : ""} ${result === "wrong" ? "wrong pulse-bad" : ""}`}>
        
        <div className="title">Comparer les fractions</div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "24px", marginBottom: "24px" }}>
          <Fraction num={num1} den={den1} />
          
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder=">, < ou ="
            style={{ width: "90px", textAlign: "center" }}
          />
          
          <Fraction num={num2} den={den2} />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="button-primary smooth hover-lift press"
            onClick={checkAnswer}
          >
            Vérifier
          </button>

          <button
            className="button-secondary smooth hover-lift press"
            onClick={() => {
              setAnswer("");
              setResult(null);
            }}
          >
            Réinitialiser
          </button>
        </div>

      </div>
    </div>
  );
}