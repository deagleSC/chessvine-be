export enum AnalysisStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface AnalysisMetadata {
  white: string;
  black: string;
  result: string;
  event?: string;
  date?: string;
  eco?: string;
  opening?: string;
}

export interface AnalysisResult {
  summary: string;
  phases: {
    name: string;
    moves: string;
    evaluation: string;
    key_ideas: string[];
  }[];
  key_moments: {
    move_number: number;
    move: string;
    fen: string;
    evaluation: string;
    comment: string;
    is_mistake: boolean;
  }[];
  recommendations: string[];
}

export interface IAnalysis {
  analysis_id: string;
  user_id: string;
  batch_id?: string;
  status: AnalysisStatus;
  pgn: string;
  gcs_url?: string;
  player_name: string;
  player_color?: PlayerColor;
  metadata: AnalysisMetadata;
  result?: AnalysisResult;
  error?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface BulkAnalysisRequest {
  urls: string[];
  playerName: string;
}

export type PlayerColor = "white" | "black";

export interface BulkAnalysisResponse {
  batch_id: string;
  analysis_ids: string[];
  total_games: number;
  skipped_games?: { white: string; black: string; reason: string }[];
}

export interface UploadResponse {
  urls: string[];
}

export interface AnalysisStatusResponse {
  [analysis_id: string]: {
    status: AnalysisStatus;
  };
}
