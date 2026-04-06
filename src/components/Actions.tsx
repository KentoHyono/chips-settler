import html2canvas from "html2canvas";
import type { ChipTrade, Player, Session, Settlement } from "../types/calc"
import type { RefObject } from "react";
import { fmt, persistSessions, uid } from "../helper/utils";

interface Props{
  buyIn:string
  players: Player[]
  trades: ChipTrade[]
  settlements:Settlement[]
  resultsRef:RefObject<HTMLDivElement | null>
  showToast:(msg:string)=>void
  setSessions:(value:React.SetStateAction<Session[]>)=>void
  unsettle:(reset:boolean)=>void
}

export default function Actions({
  buyIn,
  players,
  trades,
  settlements,
  resultsRef,
  showToast,
  setSessions,
  unsettle
}: Props){

    const buyInNum = parseFloat(buyIn) || 0;

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

    const saveSession = (): void => {
      const session: Session = {
        id: uid(),
        date: new Date().toISOString(),
        buyIn: buyInNum,
        players: players.map((p) => {
          const effectiveContribution = getEffectiveContribution(p.id);
          return {
            name: p.name,
            chips: parseFloat(p.chips) || 0,
            pnl: (parseFloat(p.chips) || 0) - effectiveContribution,
          };
        }),
        settlements,
        trades: trades.map((t) => {
          const fromPlayer = players.find((p) => p.id === t.fromPlayerId);
          const toPlayer = players.find((p) => p.id === t.toPlayerId);
          return {
            from: fromPlayer?.name || "?",
            to: toPlayer?.name || "?",
            amount: parseFloat(t.amount) || 0,
          };
        }),
      };
      setSessions((prev) => {
        const next = [session, ...prev].slice(0, 30);
        persistSessions(next);
        return next;
      });
      showToast("Session saved ✓");
    };
  return(
    <>
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
        onClick={()=>unsettle(false)}
      >
        ← Back To Entering Info
      </button>

      <button
        className="btn btn-ghost"
        style={{ width: "50%", marginTop: 14, fontSize: 14, display: "inline" }}
        onClick={()=>unsettle(true)}
      >
        + Start New Session
      </button>
    </>
  )
}