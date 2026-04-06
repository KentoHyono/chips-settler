import { useEffect } from "react";
import { fmt } from "../helper/utils";
import type { Player } from "../types/calc"

interface Props{
  buyIn:string
  setBuyIn:(value:string)=>void
  players:Player[]
}

export default function BuyIn({
  buyIn,
  setBuyIn,
  players,
}:Props){

  // Retain BuyIn value 
  useEffect(() => {
    localStorage.setItem("buyIn", JSON.stringify(buyIn));
  }, [buyIn])


  const buyInNum = parseFloat(buyIn) || 0;
  const pot = players.length * buyInNum + players.reduce((sum, p) => sum + parseFloat(p.extraBuyIn || "0"), 0);

  return(
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
  )
}