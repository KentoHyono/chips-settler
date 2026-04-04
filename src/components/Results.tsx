import type { RefObject } from "react"
import { fmt } from "../helper/utils";
import type { ChipTrade, Player, PlayerWithPnl, Settlement } from "../types/calc";

interface Props{
  buyIn:string,
  trades:ChipTrade[],
  players:Player[]
  settlements:Settlement[]
  resultsRef:RefObject<HTMLDivElement | null>
}

export default function Results({
  buyIn,
  trades,
  players,
  settlements,
  resultsRef
}:Props){

  const buyInNum = parseFloat(buyIn) || 0;

  // Helper to calculate effective contribution for a player
  const getEffectiveContribution = (playerId: string): number => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return buyInNum;

    const extraBuyIn = parseFloat(player.extraBuyIn) || 0;
    const chipsSold = trades
      .filter((t) => t.fromPlayerId === playerId)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const chipsBought = trades
      .filter((t) => t.toPlayerId === playerId)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    return buyInNum + extraBuyIn + chipsBought - chipsSold;
  };

  const withPnl: PlayerWithPnl[] = players.map((p) => {
    const effectiveContribution = getEffectiveContribution(p.id);
    return {
      ...p,
      pnl: (parseFloat(p.chips) || 0) - effectiveContribution,
    };
  });

  return(
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
    </>
  )
}