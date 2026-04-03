import React, { useState, useCallback, useRef } from "react";
import html2canvas from "html2canvas";
import type {Tab, PlayerField, Player, PlayerWithPnl, Settlement, Session, ToastState } from './types/calc'

// ── Helpers ───────────────────────────────────────────────────────────────────

const LS_KEY = "poker_sessions_v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

function fmt(n: number): string {
  return "$" + Math.abs(n).toFixed(2).replace(/\.00$/, "");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

function persistSessions(sessions: Session[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(sessions));
}

function calcSettlements(players: Player[], buyIn: string): Settlement[] {
  const bi = parseFloat(buyIn) || 0;

  type Balance = { name: string; net: number };

  const creditors: Balance[] = players
    .map((p) => ({ name: p.name || "?", net: (parseFloat(p.chips) || 0) - bi - (parseFloat(p.extraBuyIn) || 0)}))
    .filter((b) => b.net > 0)
    .sort((a, b) => b.net - a.net);

  const debtors: Balance[] = players
    .map((p) => ({ name: p.name || "?", net: (parseFloat(p.chips) || 0) - bi - (parseFloat(p.extraBuyIn) || 0)}))
    .filter((b) => b.net < 0)
    .sort((a, b) => a.net - b.net);

  const txns: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;

    const amount = Math.min(-debtor.net, creditor.net);
    if (amount > 0.005) {
      txns.push({ from: debtor.name, to: creditor.name, amount });
    }
    debtor.net += amount;
    creditor.net -= amount;
    if (Math.abs(debtor.net) < 0.005) i++;
    if (Math.abs(creditor.net) < 0.005) j++;
  }

  return txns;
}

function makeDefaultPlayers(): Player[] {
  return [
    { id: uid(), name: "", extraBuyIn: "", chips: "" },
    { id: uid(), name: "", extraBuyIn: "", chips: "" },
    { id: uid(), name: "", extraBuyIn: "", chips: "" },
  ];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toast({ msg }: { msg: string }): React.JSX.Element {
  return <div className="toast">{msg}</div>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PokerSettler(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>("calc");
  const [buyIn, setBuyIn] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>(makeDefaultPlayers);
  const [settled, setSettled] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string): void => {
    setToast({ msg, k: Date.now() });
    setTimeout(() => setToast(null), 2200);
  }, []);

  // ── Player operations ─────────────────────────────────────────────────────

  const addPlayer = (): void => {
    setPlayers((prev) => [...prev, { id: uid(), name: "", extraBuyIn: "", chips: "" }]);
  };

  const removePlayer = (id: string): void => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePlayer = (id: string, field: PlayerField, value: string): void => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const buyInNum = parseFloat(buyIn) || 0;
  const pot = players.length * buyInNum + players.reduce((sum, p) => sum + parseFloat(p.extraBuyIn || "0"), 0);
  const totalChips = players.reduce((sum, p) => sum + (parseFloat(p.chips) || 0), 0);
  const chipMismatch = buyIn !== "" && Math.abs(totalChips - pot) > 0.5;

  const settlements = calcSettlements(players, buyIn);

  const withPnl: PlayerWithPnl[] = players.map((p) => ({
    ...p,
    pnl: (parseFloat(p.chips) || 0) - buyInNum - (parseFloat(p.extraBuyIn) || 0),
  }));

  const readyToCalc =
    buyIn !== "" &&
    players.length >= 2 &&
    players.every((p) => p.name.trim() !== "" && p.chips !== "");

  // ── Session persistence ───────────────────────────────────────────────────

  const saveSession = (): void => {
    const session: Session = {
      id: uid(),
      date: new Date().toISOString(),
      buyIn: buyInNum,
      players: players.map((p) => ({
        name: p.name,
        chips: parseFloat(p.chips) || 0,
        pnl: (parseFloat(p.chips) || 0) - buyInNum - (parseFloat(p.extraBuyIn) || 0),
      })),
      settlements,
    };
    setSessions((prev) => {
      const next = [session, ...prev].slice(0, 30);
      persistSessions(next);
      return next;
    });
    showToast("Session saved ✓");
  };

  const deleteSession = (id: string): void => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistSessions(next);
      return next;
    });
    showToast("Session deleted");
  };

  const clearHistory = (): void => {
    setSessions([]);
    persistSessions([]);
    showToast("History cleared");
  };

  // ── Unsettle & Back ─────────────────────────────────────────────────────────────────

  const unsettle = (): void => {
    setSettled(false);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetCalc = (): void => {
    setSettled(false);
    setPlayers(makeDefaultPlayers());
    setBuyIn("");
  };

  // ── Load Last Game ────────────────────────────────────────────────────────

  const loadLastGame = (): void => {
    const lastSession = sessions[0];
    if (!lastSession) return;

    setBuyIn(lastSession.buyIn.toString());
    setPlayers(
      lastSession.players.map((p) => ({
        id: uid(),
        name: p.name,
        extraBuyIn: "",
        chips: "",
      }))
    );
    showToast("Last game loaded ✓");
  };

  const hasSavedGame = sessions.length > 0;

  // ── Share / Copy ──────────────────────────────────────────────────────────

  const buildShareText = (): string => {
    if (settlements.length === 0) return "No debts — everyone is square! 🃏";
    const lines = settlements.map((s) => `${s.from} pays ${s.to} ${fmt(s.amount)}`);
    return `♠ Poker Settlement ♠\nBuy-in: ${fmt(buyInNum)}\n\n${lines.join("\n")}`;
  };

  const handleShare = async (): Promise<void> => {
    if (!resultsRef.current) return;

    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedRef = clonedDoc.querySelector(".results-capture");
          if (clonedRef) {
            // Force all elements to have solid backgrounds
            clonedRef.querySelectorAll(".settlement-item").forEach((el) => {
              (el as HTMLElement).style.animation = "none";
              (el as HTMLElement).style.opacity = "1";
              (el as HTMLElement).style.background = "#ffffff";
            });
          }
        },
      });

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );

      const file = new File([blob], "poker-settlement.png", {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Poker Settlement",
            files: [file],
          });
        } catch {
          // user cancelled — do nothing
        }
      } else {
        // Fallback: copy image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        showToast("Image copied to clipboard!");
      }
    } catch {
      showToast("Share failed");
    }
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      showToast("Copied to clipboard!");
    } catch {
      showToast("Copy failed");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-suit-row">♠ ♥ ♦ ♣</div>
        <h1>Chip Settler</h1>
        <p>Poker session calculator</p>
        <div className="gold-line" />
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab${tab === "calc" ? " active" : ""}`}
          onClick={() => setTab("calc")}
        >
          ♠ Calculator
        </button>
        <button
          className={`tab${tab === "history" ? " active" : ""}`}
          onClick={() => setTab("history")}
        >
          ♣ History
        </button>
      </div>

      {/* ── Calculator: Input ── */}
      {tab === "calc" && !settled && (
        <>
          {hasSavedGame && (
            <button
              className="btn btn-secondary"
              style={{ width: "100%", marginBottom: 16 }}
              onClick={loadLastGame}
            >
              ↻ Load Last Game
            </button>
          )}

          {/* Buy-in */}
          <div className="card">
            <div className="card-title">
              <span>💰</span> Buy-In Amount
            </div>
            <label htmlFor="buyin">Amount per player ($)</label>
            <input
              id="buyin"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={buyIn}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBuyIn(e.target.value)
              }
            />
            {buyIn !== "" && (
              <div style={{ marginTop: 12 }}>
                <div className="pot-row">
                  <span className="pot-label">Players</span>
                  <span className="pot-value">{players.length}</span>
                </div>
                <div className="pot-row">
                  <span className="pot-label">Total Pot</span>
                  <span className="pot-value gold">{fmt(pot)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Players */}
          <div className="card">
            <div className="card-title">
              <span>👥</span> Players
            </div>

            <div className="player-label-row">
              <label>Name</label>
              <label>Final Chips ($)</label>
              <label>Extra Buy-In ($)</label>
              <div />
            </div>

            {players.map((p, i) => (
              <div className="player-row" key={p.id}>
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={p.name}
                  autoComplete="off"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updatePlayer(p.id, "name", e.target.value)
                  }
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={p.chips}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updatePlayer(p.id, "chips", e.target.value)
                  }
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={p.extraBuyIn}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updatePlayer(p.id, "extraBuyIn", e.target.value)
                  }
                />
                <button
                  className="btn-danger"
                  onClick={() => removePlayer(p.id)}
                  disabled={players.length <= 2}
                  aria-label={`Remove ${p.name || `Player ${i + 1}`}`}
                >
                  ✕
                </button>
              </div>
            ))}

            <button className="btn btn-secondary mt-8" onClick={addPlayer}>
              + Add Player
            </button>

            {chipMismatch && (
              <p className="warn-text">
                ⚠ Chip total ({fmt(totalChips)}) ≠ pot ({fmt(pot)}). Results
                may be inaccurate.
              </p>
            )}
          </div>

          <button
            className="btn btn-primary"
            disabled={!readyToCalc}
            onClick={() => setSettled(true)}
            style={{ opacity: readyToCalc ? 1 : 0.45 }}
          >
            ♠ Calculate Settlements
          </button>
        </>
      )}

      {/* ── Calculator: Results ── */}
      {tab === "calc" && settled && (
        <>
          <div ref={resultsRef} className="results-capture">
            {/* P&L */}
            <div className="card">
              <div className="card-title">
                <span>📊</span> Player Results
              </div>
              {withPnl.map((p) => {
                const pnlClass =
                  p.pnl > 0.005 ? "win" : p.pnl < -0.005 ? "loss" : "even";
                const pnlLabel =
                  p.pnl > 0.005
                    ? `▲ +${fmt(p.pnl)}`
                    : p.pnl < -0.005
                    ? `▼ −${fmt(Math.abs(p.pnl))}`
                    : "— even";
                return (
                  <div className="player-summary-row" key={p.id}>
                    <div>
                      <div className="psrow-name">{p.name}</div>
                      <div className="psrow-chips">{fmt(parseFloat(p.chips))} chips</div>
                    </div>
                    <span className={`pnl-badge ${pnlClass}`}>{pnlLabel}</span>
                  </div>
                );
              })}
            </div>

            {/* Settlements */}
            <div className="card">
              <div className="card-title">
                <span>🤝</span> Settlements
              </div>

              {settlements.length === 0 ? (
                <div className="no-debts">
                  <span className="big-icon">🏆</span>
                  <p>Everyone is square — no debts to settle!</p>
                </div>
              ) : (
                settlements.map((s, i) => (
                  <div className="settlement-item" key={i}>
                    <span className="s-icon">💸</span>
                    <div className="s-text">
                      <div className="s-from">{s.from}</div>
                      <div className="s-to">→ pays {s.to}</div>
                    </div>
                    <div className="s-amount">{fmt(s.amount)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="share-bar">
            <button className="btn btn-secondary" onClick={() => void handleShare()}>
              ↑ Share
            </button>
            <button className="btn btn-secondary" onClick={() => void handleCopy()}>
              ⎘ Copy
            </button>
            <button className="btn btn-secondary" onClick={saveSession}>
              ⊕ Save
            </button>
          </div>

          <button
            className="btn btn-ghost"
            style={{ width: "50%", marginTop: 14, fontSize: 14, display: "inline" }}
            onClick={unsettle}
          >
            ← Back To Entering Info
          </button>

          <button
            className="btn btn-ghost"
            style={{ width: "50%", marginTop: 14, fontSize: 14, display: "inline" }}
            onClick={resetCalc}
          >
            + Start New Session
          </button>
        </>
      )}

      {/* ── History ── */}
      {tab === "history" && (
        <>
          {sessions.length === 0 ? (
            <div className="empty-history">
              <span className="big-icon">🃏</span>
              No saved sessions yet.
              <br />
              Calculate a session and hit <strong>Save</strong> to keep it here.
            </div>
          ) : (
            <>
              {sessions.map((s) => (
                <div className="history-item" key={s.id}>
                  <div className="history-item-header">
                    <div>
                      <div className="history-date">{fmtDate(s.date)}</div>
                      <div className="history-meta">
                        {s.players.length} players · Buy-in {fmt(s.buyIn)} · Pot{" "}
                        {fmt(s.players.length * s.buyIn)}
                      </div>
                    </div>
                    <button
                      className="history-delete"
                      onClick={() => deleteSession(s.id)}
                      aria-label="Delete session"
                    >
                      🗑
                    </button>
                  </div>

                  <div className="history-players">
                    {s.players.map((p) => (
                      <span
                        key={p.name}
                        style={{
                          color:
                            p.pnl > 0
                              ? "#16a34a"
                              : p.pnl < 0
                              ? "#dc2626"
                              : "#64748b",
                          marginRight: 10,
                        }}
                      >
                        {p.name} {p.pnl > 0 ? "▲" : p.pnl < 0 ? "▼" : "—"}{" "}
                        {p.pnl >= 0 ? "+" : ""}
                        {fmt(Math.abs(p.pnl))}
                      </span>
                    ))}
                  </div>

                  {s.settlements.length > 0 ? (
                    <div className="history-settlements">
                      {s.settlements.map((t, i) => (
                        <div key={i}>
                          {t.from} → {t.to}: {fmt(t.amount)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="history-settlements" style={{ color: "#16a34a" }}>
                      No debts — everyone was square
                    </div>
                  )}
                </div>
              ))}

              <button
                className="btn btn-ghost"
                style={{
                  width: "100%",
                  marginTop: 8,
                  color: "rgba(220, 38, 38, 0.6)",
                }}
                onClick={clearHistory}
              >
                Clear all history
              </button>
            </>
          )}
        </>
      )}

      {toast !== null && <Toast msg={toast.msg} key={toast.k} />}
    </div>
  );
}