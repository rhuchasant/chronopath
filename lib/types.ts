export interface VisitInfo {
  entry: string;
  hours: string;
  best_time: string;
  accessibility: string;
  duration_typical: string;
}

export interface StopImage {
  url: string;
  caption: string;
  era: "historical" | "modern";
  attribution: string;
  license: string;
}

export interface Stop {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  year_built?: number;
  themes: string[];
  visit_info?: VisitInfo;
  images?: StopImage[];
}

export interface Walk {
  id: string;
  title: string;
  subtitle: string;
  era: string;
  duration_min: number;
  distance_km: number;
  description: string;
  stops: Stop[];
}

export interface Persona {
  id: string;
  label: string;
  blurb: string;
  prompting_profile: string;
}

export type SourceType = "primary" | "secondary" | "oral" | "colonial" | "wiki";

export type VerificationStatus =
  | "verified"
  | "ai_drafted_unverified"
  | "user_added";

export interface Source {
  id: string;
  stop_id: string;
  source_type: SourceType;
  source_name: string;
  year?: number | null;
  url?: string | null;
  verification_status: VerificationStatus;
  bias_notes: string;
  content: string;
  themes: string[];
}

export interface RetrievedSource extends Source {
  score: number;
  retrieval_reasons: string[];
}

export interface Narrative {
  stop_id: string;
  persona_id: string;
  text: string;
  citations: { source_id: string; quoted: string }[];
  model: string;
}

export interface CritiqueScore {
  factual_accuracy: number;
  persona_fit: number;
  cultural_sensitivity: number;
  source_bias_awareness: number;
}

export interface Critique {
  scores: CritiqueScore;
  notes: string;
  needs_revision: boolean;
  revision_request?: string;
}

export interface PathReasoning {
  from_stop: string;
  to_stop: string;
  primary_reason: string;
  secondary_reasons: string[];
  counterfactual: string;
  confidence: number;
  uncertainty_notes: string;
}