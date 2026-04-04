import type { Tab } from "../types/calc"

interface Props{
  tab:Tab
  setTab:(tab:Tab)=>void
}

export default function Tabs({tab,setTab}:Props){

  return(
    <div className="tabs">

      <button
        className={`tab ${tab==="calc"?"active":""}`}
        onClick={()=>setTab("calc")}
      >
        ♠ Calculator
      </button>

      <button
        className={`tab ${tab==="history"?"active":""}`}
        onClick={()=>setTab("history")}
      >
        ♣ History
      </button>

    </div>
  )
}