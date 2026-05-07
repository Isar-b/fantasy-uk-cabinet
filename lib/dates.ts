export const SWAP_DEADLINE = "2026-06-20T23:59:59Z";
export const SCORING_DATE = "2026-07-01T00:00:00Z";

export const SQUAD_SIZE = 10;
export const BUDGET = 100;

export function isPastDeadline(now = new Date(), deadline = SWAP_DEADLINE): boolean {
  return now.getTime() >= new Date(deadline).getTime();
}

export function isPastScoring(now = new Date(), scoring = SCORING_DATE): boolean {
  return now.getTime() >= new Date(scoring).getTime();
}

export function timeUntil(target: string, now = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  past: boolean;
} {
  const ms = new Date(target).getTime() - now.getTime();
  const past = ms <= 0;
  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  return { days, hours, minutes, past };
}
