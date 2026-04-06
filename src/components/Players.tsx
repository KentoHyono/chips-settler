import { fmt } from "../helper/utils"
import type { Player } from "../types/calc"

interface Props{
  buyIn:string
  players:Player[]

  addPlayer:()=>void
  removePlayer:(id:string)=>void
  updatePlayer:(id:string,field:string,value:string)=>void
}

export default function Players({
  buyIn,
  players,
  addPlayer,
  removePlayer,
  updatePlayer
}:Props){

  const buyInNum = parseFloat(buyIn) || 0;
  const pot = players.length * buyInNum + players.reduce((sum, p) => sum + parseFloat(p.extraBuyIn || "0"), 0);
  const totalChips = players.reduce((sum, p) => sum + (parseFloat(p.chips) || 0), 0);
  const chipMismatch = buyIn !== "" && Math.abs(totalChips - pot) > 0.5;

  return(
    <div className="card">

      <div className="card-title">
        👥 Players
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
  )
}