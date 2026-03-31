// poker.d.ts

export type Tab = "calc" | "history";

export type PlayerField = "name" | "chips" | "extraBuyIn";

export interface Player {
  id: string; 
  name: string;
  extraBuyIn : string;
  chips: string;
}

export interface PlayerWithPnl extends Player {
  pnl: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface SavedPlayer {
  name: string;
  chips: number;
  pnl: number;
}

export interface Session {
  id: string;
  date: string;
  buyIn: number;
  players: SavedPlayer[];
  settlements: Settlement[];
}

export interface ToastState {
  msg: string;
  k: number;
}