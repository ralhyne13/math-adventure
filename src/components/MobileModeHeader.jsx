export default function MobileModeHeader({
  heroClassName = "",
  backLabel = "Accueil",
  onBack,
  pills = [],
  eyebrow,
  title,
  description,
  actions = [],
}) {
  return (
    <section className={`classicPlayTopbar classicModeBar mobileModeHero ${heroClassName}`.trim()}>
      <div className="mobileModeHeroTop">
        {onBack ? (
          <button className="btn smooth hover-lift press" onClick={onBack}>
            {backLabel}
          </button>
        ) : (
          <div />
        )}

        {!!pills.length && (
          <div className="mobileModeHeroPills">
            {pills.map((pill) => (
              <span key={pill} className="pill">
                {pill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="classicPlayTitleWrap mobileModeTitleWrap">
        {eyebrow ? <div className="classicModeEyebrow">{eyebrow}</div> : null}
        <div className="classicPlayTitle">{title}</div>
        {description ? <div className="small">{description}</div> : null}
      </div>

      {!!actions.length && (
        <div className="classicPlayActions mobileModeActionGrid">
          {actions.map((action) => (
            <button
              key={action.label}
              className={`btn smooth hover-lift press ${action.primary ? "btnPrimary" : ""}`.trim()}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
