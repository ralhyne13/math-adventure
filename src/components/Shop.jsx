import Modal from "./Modal";

export default function Shop({
  show,
  onClose,
  shopTab,
  setShopTab,
  coins,
  SKINS,
  AVATARS,
  ownedSkins,
  skinId,
  canBuy,
  buySkin,
  equipSkin,
  ownedAvatars,
  avatarId,
  buyAvatar,
  equipAvatar,
  isPremium,
}) {
  if (!show) return null;

  return (
    <Modal title="Boutique - Skins & Avatars" onClose={onClose}>
      <div className="tabs">
        <button className={`btn smooth hover-lift press ${shopTab === "skins" ? "btnPrimary" : ""}`} onClick={() => setShopTab("skins")}>
          Skins
        </button>
        <button className={`btn smooth hover-lift press ${shopTab === "avatars" ? "btnPrimary" : ""}`} onClick={() => setShopTab("avatars")}>
          Avatars
        </button>
        <div className="coins" style={{ marginLeft: "auto" }}>
          <span className="coinDot" />
          <span>{coins} pieces</span>
        </div>
      </div>

      {shopTab === "skins" && (
        <>
          <div className="small" style={{ marginBottom: 12 }}>
            Achete des skins avec tes pieces. Les skins premium demandent un abonnement.
          </div>

          <div className="shopGrid">
            {SKINS.map((s) => {
              const owned = ownedSkins.includes(s.id);
              const equipped = skinId === s.id;
              const premiumLocked = !!s.premiumOnly && !isPremium;
              return (
                <div key={s.id} className="shopCard smooth hover-lift">
                  <div className="preview" style={{ background: `linear-gradient(135deg, ${s.vars["--accent"]}, ${s.vars["--accent2"]})` }} />
                  <div className="shopRow">
                    <div className="shopLeft">
                      <div className="shopTitle">
                        {s.name} {s.animated ? "✨" : ""}
                      </div>
                      {s.premiumOnly && <div className="small">Premium requis</div>}
                      <div className="small">{s.desc}</div>
                    </div>
                    <div className="shopRight">
                      <span className="price">
                        <span className="coinDot" /> {s.price}
                      </span>
                      {owned ? (
                        <button className={`btn smooth hover-lift press ${equipped ? "btnPrimary" : ""}`} onClick={() => equipSkin(s.id)}>
                          {equipped ? "Equipe" : "Equiper"}
                        </button>
                      ) : premiumLocked ? (
                        <button className="btn smooth" disabled>
                          Premium
                        </button>
                      ) : (
                        <button className="btn btnPrimary smooth hover-lift press" disabled={!canBuy(s.price)} onClick={() => buySkin(s)}>
                          Acheter
                        </button>
                      )}
                    </div>
                  </div>
                  {!owned && !premiumLocked && !canBuy(s.price) && <div className="small" style={{ marginTop: 10 }}>Pas assez de pieces</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {shopTab === "avatars" && (
        <>
          <div className="small" style={{ marginBottom: 12 }}>
            Achete et equipe un avatar.
          </div>

          <div className="shopGrid">
            {AVATARS.map((a) => {
              const owned = ownedAvatars.includes(a.id);
              const equipped = avatarId === a.id;
              const isExclusive = a.rarity === "Exclusif";
              const premiumLocked = !!a.premiumOnly && !isPremium;

              return (
                <div key={a.id} className={`shopCard smooth hover-lift ${isExclusive ? "premium" : ""}`}>
                  <div className="shopRibbonWrap">{isExclusive && <div className="ribbon">Exclusif</div>}</div>
                  <div className="shopRow">
                    <div className="shopLeft">
                      <div className="avatarBig">{a.emoji}</div>
                      <div className="shopTitle">{a.name}</div>
                      <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span className="rarity">{a.rarity}</span>
                        {a.premiumOnly && <span className="rarity">Premium</span>}
                      </div>
                    </div>

                    <div className="shopRight">
                      <span className="price">
                        <span className="coinDot" /> {a.price}
                      </span>

                      {owned ? (
                        <button className={`btn smooth hover-lift press ${equipped ? "btnPrimary" : ""}`} onClick={() => equipAvatar(a.id)}>
                          {equipped ? "Equipe" : "Equiper"}
                        </button>
                      ) : premiumLocked ? (
                        <button className="btn smooth" disabled>
                          Premium
                        </button>
                      ) : (
                        <button className="btn btnPrimary smooth hover-lift press" disabled={!canBuy(a.price)} onClick={() => buyAvatar(a)}>
                          Acheter
                        </button>
                      )}
                    </div>
                  </div>

                  {!owned && !premiumLocked && !canBuy(a.price) && <div className="small" style={{ marginTop: 10 }}>Continue a jouer pour gagner des pieces</div>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}
