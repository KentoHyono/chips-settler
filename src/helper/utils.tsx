// ── Helpers ───────────────────────────────────────────────────────────────────

import type { ChipTrade, Player, Session, Settlement } from "../types/calc";

const LS_KEY = "poker_sessions_v2";

export function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function fmt(n: number): string {
  return "$" + Math.abs(n).toFixed(2).replace(/\.00$/, "");
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

export function persistSessions(sessions: Session[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(sessions));
}

export function calcSettlements(players: Player[], buyIn: string, trades: ChipTrade[]): Settlement[] {
  const bi = parseFloat(buyIn) || 0;

  type Balance = { name: string; net: number };

  // Calculate each player's effective contribution
  const playerContributions: Record<string, number> = {};
  players.forEach((p) => {
    const playerName = p.name || "?";
    const extraBuyIn = parseFloat(p.extraBuyIn) || 0;

    // Calculate chips sold and bought via trades
    const chipsSold = trades
      .filter((t) => t.fromPlayerId === p.id)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const chipsBought = trades
      .filter((t) => t.toPlayerId === p.id)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // effectiveContribution = initialBuyIn + extraBuyIn + chipsBought - chipsSold
    playerContributions[playerName] = bi + extraBuyIn + chipsBought - chipsSold;
  });

  const creditors: Balance[] = players
    .map((p) => {
      const playerName = p.name || "?";
      const chips = parseFloat(p.chips) || 0;
      const contribution = playerContributions[playerName] || bi;
      return { name: playerName, net: chips - contribution };
    })
    .filter((b) => b.net > 0)
    .sort((a, b) => b.net - a.net);

  const debtors: Balance[] = players
    .map((p) => {
      const playerName = p.name || "?";
      const chips = parseFloat(p.chips) || 0;
      const contribution = playerContributions[playerName] || bi;
      return { name: playerName, net: chips - contribution };
    })
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

export function makeDefaultPlayers(): Player[] {
  return [
    { id: uid(), name: "", extraBuyIn: "", chips: "" },
    { id: uid(), name: "", extraBuyIn: "", chips: "" },
    { id: uid(), name: "", extraBuyIn: "", chips: "" },
  ];
}