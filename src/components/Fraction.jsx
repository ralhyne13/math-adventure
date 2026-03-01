export default function Fraction({ n, d }) {
  return (
    <div className="fraction" aria-label={`${n} sur ${d}`}>
      <span>{n}</span>
      <span>{d}</span>
    </div>
  );
}
