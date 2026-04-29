export interface Stop {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  year_built?: number;
  themes: string[];
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

export interface Source {
  id: string;
  stop_id: string;
  source_type: SourceType;
  source_name: string;
  year?: number;
  url?: string;
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
  factual_accuracy: number;       // 0-5
  persona_fit: number;            // 0-5
  cultural_sensitivity: number;   // 0-5
  source_bias_awareness: number;  // 0-5
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
