import { useState, useRef, useCallback } from "react"

import Header from "./components/Header"
import Tabs from "./components/Tabs"
import BuyIn from "./components/BuyIn"
import Players from "./components/Players"
import ChipTrades from "./components/ChipTrades"
import Results from "./components/Results"
import Actions from "./components/Actions"
import History from "./components/History"

import type { Player, ChipTrade, Tab, Session, ToastState } from "./types/calc"
import { calcSettlements, loadSessions, makeDefaultPlayers, uid } from "./helper/utils"
import Toast from "./components/Toast"

export default function App() {
  const [tab,setTab] = useState<Tab>("calc")

  // Retain values over refresh
  const [buyIn,setBuyIn] = useState(() => {
    const saved = localStorage.getItem("buyIn");
    return saved ? JSON.parse(saved) : "";
  })
  const [players,setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem("players");
    return saved ? JSON.parse(saved) : makeDefaultPlayers();
  })
  const [trades,setTrades] = useState<ChipTrade[]>(() => {
    const saved = localStorage.getItem("trades");
    return saved ? JSON.parse(saved) : [];
  })
  const [settled,setSettled] = useState((false))

  const [toast, setToast] = useState<ToastState | null>(null);
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const resultsRef = useRef<HTMLDivElement>(null)

  const settlements = calcSettlements(players, buyIn, trades);
    
  const showToast = useCallback((msg: string): void => {
    setToast({ msg, k: Date.now() });
    setTimeout(() => setToast(null), 2200);
  }, []);
  
  const addPlayer = () =>{
    setPlayers(prev=>[
      ...prev,
      { id:crypto.randomUUID(), name:"", chips:"", extraBuyIn:""}
    ])
  }

  const removePlayer = (id:string)=>{
    setPlayers(prev=>prev.filter(p=>p.id!==id))
  }

  const updatePlayer = (id:string,field:string,value:string)=>{
    setPlayers(prev =>
      prev.map(p =>
        p.id===id ? {...p,[field]:value} : p
      )
    )
  }

  const addTrade = ()=>{
    setTrades(prev=>[
      ...prev,
      {id:crypto.randomUUID(),fromPlayerId:"",toPlayerId:"",amount:""}
    ])
  }

  const removeTrade = (id:string)=>{
    setTrades(prev=>prev.filter(t=>t.id!==id))
  }

  const updateTrade = (id:string,field:string,value:string)=>{
    setTrades(prev =>
      prev.map(t =>
        t.id===id ? {...t,[field]:value} : t
      )
    )
  }

  const updateTradePlayer = (id: string, field: "fromPlayerId" | "toPlayerId", value: string): void => {
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const loadLastGame = (): void => {
    unsettle(true)
    const lastSession = sessions[0];
    if (!lastSession) return;

    setBuyIn(lastSession.buyIn.toString());
    const newPlayers = lastSession.players.map((p) => ({
      id: uid(),
      name: p.name,
      extraBuyIn: "",
      chips: "",
    }));
    setPlayers(newPlayers); 

    showToast("Last game loaded ✓");
  };

  const unsettle = (reset:boolean=false): void => {
    setSettled(false);

    if(reset) {      
      setPlayers(makeDefaultPlayers());
      setTrades([]);
      setBuyIn("");
    }
  };

  const hasSavedGame = sessions.length > 0;
  const readyToCalc =
    buyIn !== "" &&
    players.length >= 2 &&
    players.every((p) => p.name.trim() !== "" && p.chips !== "");

  return (
    <div className="app">

      <Header/>

      <Tabs tab={tab} setTab={setTab}/>

      {tab==="calc" && !settled && (
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
        <BuyIn
          buyIn={buyIn}
          setBuyIn={setBuyIn}
          players={players}
        />

        <Players
          buyIn={buyIn}
          players={players}
          addPlayer={addPlayer}
          removePlayer={removePlayer}
          updatePlayer={updatePlayer}
        />

        <ChipTrades
          trades={trades}
          players={players}
          addTrade={addTrade}
          removeTrade={removeTrade}
          updateTrade={updateTrade}
          updateTradePlayer={updateTradePlayer}
        />

        <button
          className="btn btn-primary"
          disabled={!readyToCalc}
          onClick={() => setSettled(true)}
          style={{ opacity: readyToCalc ? 1 : 0.45 }}
        >
          Calculate Settlements
        </button>
        </>
      )}

      {tab==="calc" && settled && (
        <>
          <Results
            buyIn={buyIn}
            players={players}
            trades={trades}
            settlements={settlements}
            resultsRef={resultsRef}
          />

          <Actions 
            buyIn={buyIn}
            players={players}
            trades={trades}
            settlements={settlements}
            resultsRef={resultsRef}
            showToast={showToast}
            setSessions={setSessions}
            unsettle={unsettle}
          />
        </>
      )}

      {tab==="history" && (
        <History 
          sessions={sessions}
          setSessions={setSessions}
          showToast={showToast}
        />
      )}
      {toast !== null && <Toast msg={toast.msg} key={toast.k} />}
    </div>
  )
}