export default function Modal({ title, onClose, children, presentation = "modal" }) {
  if (presentation === "page") {
    return (
      <div className="pageSheet" role="region" aria-label={title}>
        <div className="pageSheetHead">
          <div className="modalTitle">{title}</div>
          <button className="btn btnGhost smooth hover-lift press" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="pageSheetBody">{children}</div>
      </div>
    );
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="modalTitle">{title}</div>
          <button className="btn btnGhost smooth hover-lift press" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
