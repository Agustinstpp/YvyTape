/**
 * YVYPASS — Supabase Database Types
 * Tipado de las tablas, vistas y RPCs de PostgreSQL generadas para Supabase.
 */

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
          full_name: string;
          role: "productor" | "comprador" | "operador";
          phone: string | null;
          zone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: "productor" | "comprador" | "operador";
          phone?: string | null;
          zone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: "productor" | "comprador" | "operador";
          phone?: string | null;
          zone?: string | null;
          created_at?: string;
        };
      };
      farms: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          zone: string;
          province: string;
          approximate_lat: number | null;
          approximate_lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          zone: string;
          province?: string;
          approximate_lat?: number | null;
          approximate_lng?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          zone?: string;
          province?: string;
          approximate_lat?: number | null;
          approximate_lng?: number | null;
          created_at?: string;
        };
      };
      livestock_lots: {
        Row: {
          id: string;
          producer_id: string;
          farm_id: string;
          title: string;
          category: "ternero" | "ternera" | "novillo" | "vaquillona" | "vaca" | "toro";
          breed: string;
          head_count: number;
          average_weight_kg: number;
          electronic_tag_reference: string | null;
          verification_status: "declarado" | "pendiente" | "revisado";
          status: "disponible" | "reservado" | "vendido";
          created_at: string;
        };
        Insert: {
          id?: string;
          producer_id?: string;
          farm_id: string;
          title: string;
          category: "ternero" | "ternera" | "novillo" | "vaquillona" | "vaca" | "toro";
          breed: string;
          head_count: number;
          average_weight_kg: number;
          electronic_tag_reference?: string | null;
          verification_status?: "declarado" | "pendiente" | "revisado";
          status?: "disponible" | "reservado" | "vendido";
          created_at?: string;
        };
        Update: {
          id?: string;
          producer_id?: string;
          farm_id?: string;
          title?: string;
          category?: "ternero" | "ternera" | "novillo" | "vaquillona" | "vaca" | "toro";
          breed?: string;
          head_count?: number;
          average_weight_kg?: number;
          electronic_tag_reference?: string | null;
          verification_status?: "declarado" | "pendiente" | "revisado";
          status?: "disponible" | "reservado" | "vendido";
          created_at?: string;
        };
      };
      sales_pools: {
        Row: {
          id: string;
          title: string;
          zone: string;
          category: "ternero" | "ternera" | "novillo" | "vaquillona" | "vaca" | "toro";
          target_heads: number;
          status: "abierto" | "objetivo_alcanzado" | "en_negociacion" | "cerrado" | "cancelado";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          zone: string;
          category: "ternero" | "ternera" | "novillo" | "vaquillona" | "vaca" | "toro";
          target_heads: number;
          status?: "abierto" | "objetivo_alcanzado" | "en_negociacion" | "cerrado" | "cancelado";
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          zone?: string;
          category?: "ternero" | "ternera" | "novillo" | "vaquillona" | "vaca" | "toro";
          target_heads?: number;
          status?: "abierto" | "objetivo_alcanzado" | "en_negociacion" | "cerrado" | "cancelado";
          created_by?: string;
          created_at?: string;
        };
      };
      pool_members: {
        Row: {
          id: string;
          pool_id: string;
          lot_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          lot_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          lot_id?: string;
          joined_at?: string;
        };
      };
      offers: {
        Row: {
          id: string;
          pool_id: string;
          buyer_id: string;
          price_per_kg: number;
          status: "pendiente" | "aceptada" | "rechazada";
          created_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          buyer_id?: string;
          price_per_kg: number;
          status?: "pendiente" | "aceptada" | "rechazada";
          created_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          buyer_id?: string;
          price_per_kg?: number;
          status?: "pendiente" | "aceptada" | "rechazada";
          created_at?: string;
        };
      };
      offer_confirmations: {
        Row: {
          id: string;
          offer_id: string;
          producer_id: string;
          accepted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          offer_id: string;
          producer_id?: string;
          accepted: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          offer_id?: string;
          producer_id?: string;
          accepted?: boolean;
          created_at?: string;
        };
      };
      commercial_events: {
        Row: {
          id: string;
          pool_id: string;
          actor_id: string;
          event_type: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          actor_id?: string;
          event_type: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          actor_id?: string;
          event_type?: string;
          details?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: "productor" | "comprador" | "operador";
      };
      rpc_join_pool: {
        Args: {
          p_pool_id: string;
          p_lot_id: string;
        };
        Returns: {
          success: boolean;
          message: string;
          current_heads: number;
          target_heads: number;
          pool_status: string;
        };
      };
      rpc_leave_pool: {
        Args: {
          p_pool_id: string;
          p_lot_id: string;
        };
        Returns: {
          success: boolean;
          message: string;
          current_heads: number;
          pool_status: string;
        };
      };
      rpc_create_offer: {
        Args: {
          p_pool_id: string;
          p_price_per_kg: number;
        };
        Returns: {
          success: boolean;
          offer_id: string;
          message: string;
        };
      };
      rpc_confirm_offer: {
        Args: {
          p_offer_id: string;
          p_accepted: boolean;
        };
        Returns: {
          success: boolean;
          message: string;
          all_confirmed: boolean;
          total_producers: number;
          confirmed_producers: number;
        };
      };
      rpc_close_pool: {
        Args: {
          p_pool_id: string;
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
    };
    Enums: {
      user_role: "productor" | "comprador" | "operador";
      livestock_category: "ternero" | "ternera" | "novillo" | "vaquillona" | "vaca" | "toro";
      verification_status: "declarado" | "pendiente" | "revisado";
      lot_status: "disponible" | "reservado" | "vendido";
      pool_status: "abierto" | "objetivo_alcanzado" | "en_negociacion" | "cerrado" | "cancelado";
      offer_status: "pendiente" | "aceptada" | "rechazada";
    };
  };
}
