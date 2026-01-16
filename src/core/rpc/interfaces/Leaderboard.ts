import { LeaderboardRow } from './LeaderboardRow.js';

export interface Leaderboard {
  name: string;
  rows: Array<LeaderboardRow>;
}
