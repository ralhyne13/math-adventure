import Modal from "./Modal";

export default function Shop({
  show,
  onClose,
  presentation = "modal",
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

  const isMobilePage = presentation === "page";
  const modalTitle = isMobilePage ? "Boutique" : "Boutique - Skins & Avatars";

  return (
    <Modal title={modalTitle} onClose={onClose} presentation={presentation}>
      <div className={`panelSectionStack ${isMobilePage ? "mobilePanelStack" : ""}`}>
        <div className={`panelTabs panelTabsRefresh ${isMobilePage ? "mobilePageTabs" : ""}`}>
          <button className={`btn smooth hover-lift press ${shopTab === "skins" ? "btnPrimary" : ""}`} onClick={() => setShopTab("skins")}>
            Skins
          </button>
          <button className={`btn smooth hover-lift press ${shopTab === "avatars" ? "btnPrimary" : ""}`} onClick={() => setShopTab("avatars")}>
            Avatars
          </button>
          <div className={`coins ${isMobilePage ? "mobilePageCoins" : ""}`} style={{ marginLeft: isMobilePage ? 0 : "auto" }}>
            <span className="coinDot" />
            <span>{coins} pieces</span>
          </div>
        </div>

        {shopTab === "skins" && (
          <div className="panelSectionStack">
            <section className={`panelIntroCard small ${isMobilePage ? "mobilePageIntroCard" : ""}`}>
              Skins visuels pour changer l'ambiance. Les skins premium demandent un abonnement actif.
            </section>

            <div className={`shopGrid ${isMobilePage ? "mobileShopGrid" : ""}`}>
              {SKINS.map((s) => {
                const owned = ownedSkins.includes(s.id);
                const equipped = skinId === s.id;
                const premiumLocked = !!s.premiumOnly && !isPremium;

                return (
                  <div key={s.id} className={`shopCard smooth hover-lift panelCard ${isMobilePage ? "mobileShopCard" : ""}`}>
                    <div className="preview" style={{ background: `linear-gradient(135deg, ${s.vars["--accent"]}, ${s.vars["--accent2"]})` }} />
                    <div className={`shopRow ${isMobilePage ? "mobileShopRow" : ""}`}>
                      <div className="shopLeft">
                        <div className="shopTitle">
                          {s.name} {s.animated ? "*" : ""}
                        </div>
                        {s.premiumOnly && <div className="small">Premium requis</div>}
                        <div className="small">{s.desc}</div>
                      </div>
                      <div className={`shopRight ${isMobilePage ? "mobileShopActions" : ""}`}>
                        <span className="price">
                          <span className="coinDot" /> {s.price}
                        </span>
                        {owned ? (
                          <button className={`btn smooth hover-lift press ${equipped ? "btnPrimary" : ""}`} onClick={() => equipSkin(s.id)}>
                            {equipped ? "Actif" : "Equiper"}
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
                    {!owned && !premiumLocked && !canBuy(s.price) && <div className="small" style={{ marginTop: 10 }}>Pas assez de pieces pour ce skin</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {shopTab === "avatars" && (
          <div className="panelSectionStack">
            <section className={`panelIntroCard small ${isMobilePage ? "mobilePageIntroCard" : ""}`}>
              Avatars de profil pour personnaliser ton hub mobile et tes ecrans de jeu.
            </section>

            <div className={`shopGrid ${isMobilePage ? "mobileShopGrid" : ""}`}>
              {AVATARS.map((a) => {
                const owned = ownedAvatars.includes(a.id);
                const equipped = avatarId === a.id;
                const isExclusive = a.rarity === "Exclusif";
                const premiumLocked = !!a.premiumOnly && !isPremium;

                return (
                  <div key={a.id} className={`shopCard smooth hover-lift panelCard ${isExclusive ? "premium" : ""} ${isMobilePage ? "mobileShopCard" : ""}`}>
                    <div className="shopRibbonWrap">{isExclusive && <div className="ribbon">Exclusif</div>}</div>
                    <div className={`shopRow ${isMobilePage ? "mobileShopRow" : ""}`}>
                      <div className="shopLeft">
                        <div className="avatarBig">{a.emoji}</div>
                        <div className="shopTitle">{a.name}</div>
                        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span className="rarity">{a.rarity}</span>
                          {a.premiumOnly && <span className="rarity">Premium</span>}
                        </div>
                      </div>

                      <div className={`shopRight ${isMobilePage ? "mobileShopActions" : ""}`}>
                        <span className="price">
                          <span className="coinDot" /> {a.price}
                        </span>

                        {owned ? (
                          <button className={`btn smooth hover-lift press ${equipped ? "btnPrimary" : ""}`} onClick={() => equipAvatar(a.id)}>
                            {equipped ? "Actif" : "Equiper"}
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

                    {!owned && !premiumLocked && !canBuy(a.price) && <div className="small" style={{ marginTop: 10 }}>Continue a jouer pour gagner plus de pieces</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
