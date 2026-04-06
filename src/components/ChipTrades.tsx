import type { ChipTrade,Player, TradeField } from "../types/calc"

interface Props{

  trades:ChipTrade[]
  players:Player[]

  addTrade:()=>void
  removeTrade:(id:string)=>void
  updateTrade:(id:string,field:TradeField,value:string)=>void
  updateTradePlayer:(id:string,field:"fromPlayerId" | "toPlayerId",value:string)=>void
}

export default function ChipTrades({
  trades,
  players,
  addTrade,
  removeTrade,
  updateTrade,
  updateTradePlayer
}:Props){

  return(
    <div className="card">
      <div className="card-title">
        <span>🔄</span> Chip Trades
      </div>
      <p className="card-desc">
        Record when players buy chips directly from another player with cash that's calculated at the end.
        This feature is not for on-the-spot payment. 
      </p>

      {trades.length > 0 && (
        <div className="trade-label-row">
          <label>From (sells)</label>
          <label>To (buys)</label>
          <label>Amount ($)</label>
          <div />
        </div>
      )}

      {trades.map((t, i) => (
        <div className="trade-row" key={t.id}>
          <select
            value={t.fromPlayerId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateTradePlayer(t.id, "fromPlayerId", e.target.value)
            }
          >
            <option value="">Select</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === t.toPlayerId}>
                {p.name || `Player ${players.findIndex((x) => x.id === p.id) + 1}`}
              </option>
            ))}
          </select>
          <select
            value={t.toPlayerId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateTradePlayer(t.id, "toPlayerId", e.target.value)
            }
          >
            <option value="">Select</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === t.fromPlayerId}>
                {p.name || `Player ${players.findIndex((x) => x.id === p.id) + 1}`}
              </option>
            ))}
          </select>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={t.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateTrade(t.id, "amount", e.target.value)
            }
          />
          <button
            className="btn-danger"
            onClick={() => removeTrade(t.id)}
            aria-label={`Remove trade ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}

      <button className="btn btn-secondary mt-8" onClick={addTrade}>
        + Add Trade
      </button>
    </div>
  )
}