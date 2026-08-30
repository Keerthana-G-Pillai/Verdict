// ============================================================
// VERDICT — Supabase Database Types
// Generated from schema. Update after schema changes.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          updated_at?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          change_type: string;
          language: string | null;
          domain: string | null;
          verdict: string;
          risk_score: number;
          confidence: number;
          critical_count: number;
          high_count: number;
          result: Json;
          ai_provider: string | null;
          ai_enhanced: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title: string;
          change_type: string;
          language?: string | null;
          domain?: string | null;
          verdict: string;
          risk_score: number;
          confidence: number;
          critical_count: number;
          high_count: number;
          result: Json;
          ai_provider?: string | null;
          ai_enhanced?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          verdict?: string;
          risk_score?: number;
          result?: Json;
          updated_at?: string;
        };
      };
      simulations: {
        Row: {
          id: string;
          user_id: string;
          title_a: string;
          title_b: string;
          domains_a: string[];
          domains_b: string[];
          conflict_count: number;
          critical_conflict_count: number;
          integration_risk_score: number;
          verdict: string;
          verdict_rationale: string;
          result: Json;
          ai_provider: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title_a: string;
          title_b: string;
          domains_a: string[];
          domains_b: string[];
          conflict_count: number;
          critical_conflict_count: number;
          integration_risk_score: number;
          verdict: string;
          verdict_rationale: string;
          result: Json;
          ai_provider?: string | null;
          created_at?: string;
        };
        Update: {
          verdict?: string;
          result?: Json;
        };
      };
      memory: {
        Row: {
          id: string;
          user_id: string;
          analysis_id: string;
          saved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          analysis_id: string;
          saved_at?: string;
        };
        Update: Record<string, never>;
      };
      simulation_memory: {
        Row: {
          id: string;
          user_id: string;
          simulation_id: string;
          saved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          simulation_id: string;
          saved_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
