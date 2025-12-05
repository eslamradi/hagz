import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
}

export type PlayMode = 'league' | 'rotational';
export type BookingStatus = 'open' | 'allocating' | 'in-progress' | 'completed';
export type PlayerStatus = 'active' | 'waiting';
export type MatchStatus = 'scheduled' | 'completed';

export interface Booking {
  id: string;
  code: string;
  playDate: Timestamp;
  description: string;
  locationUrl: string;
  acceptedCapacity: number;
  numTeams: number;
  playersPerTeam: number;
  playMode: PlayMode;
  status: BookingStatus;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Player {
  id: string;
  playerName: string;
  addedAt: Timestamp;
  addedBy: string | null;
  userId: string | null;
  status: PlayerStatus;
  teamId: string | null;
  position: number;
}

export interface Team {
  id: string;
  teamName: string;
  players: string[];
  createdAt: Timestamp;
}

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  status: MatchStatus;
  team1Score: number | null;
  team2Score: number | null;
  round: number;
  order: number;
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}


