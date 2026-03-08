/**
 * High score tracking for Ship Happens (single-player personal best).
 * Stores scores in localStorage, sorted by net worth descending.
 */

const HIGH_SCORE_KEY = "ship-happens-high-scores";
const MAX_HIGH_SCORES = 10;

/** A single high score entry. */
export interface HighScoreEntry {
  playerName: string;
  companyName: string;
  netWorth: number;
  rating: string;
  year: number;
  week: number;
  date: string;
  gameDurationYears: number | null;
  voyages: number;
  portsVisited: number;
}

/**
 * Get all stored high scores, sorted by net worth descending.
 */
export function getHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (!raw) return [];
    const scores = JSON.parse(raw) as HighScoreEntry[];
    return scores.sort((a, b) => b.netWorth - a.netWorth);
  } catch {
    return [];
  }
}

/**
 * Save a new high score. Keeps only the top entries.
 */
export function saveHighScore(entry: HighScoreEntry): void {
  try {
    const scores = getHighScores();
    scores.push(entry);
    scores.sort((a, b) => b.netWorth - a.netWorth);
    const trimmed = scores.slice(0, MAX_HIGH_SCORES);
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage may be full or unavailable; silently ignore
  }
}
