export default function Modal({ title, onClose, children, presentation = "modal" }) {
  if (presentation === "page") {
    return (
      <section className="pageSheet pageSheetMobile" role="region" aria-label={title}>
        <div className="pageSheetHead">
          <div className="pageSheetMeta">
            <div className="pageSheetEyebrow">Mobile</div>
            <div className="modalTitle">{title}</div>
          </div>
          <button className="btn btnGhost smooth hover-lift press pageSheetClose" onClick={onClose} aria-label="Fermer">
            X
          </button>
        </div>
        <div className="pageSheetBody pageSheetBodyMobile">{children}</div>
      </section>
    );
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="modalTitle">{title}</div>
          <button className="btn btnGhost smooth hover-lift press" onClick={onClose} aria-label="Fermer">
            X
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
