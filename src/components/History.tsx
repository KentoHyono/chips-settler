import { fmt, fmtDate, persistSessions } from "../helper/utils";
import type { Session } from "../types/calc"

interface Props{
  sessions:Session[]
  setSessions:(value:React.SetStateAction<Session[]>)=>void
  showToast:(msg:string)=>void
}

export default function History({
  sessions,
  setSessions,
  showToast
}:Props){

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

  return(
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
  )
}