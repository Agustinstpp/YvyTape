/**
 * YVYPASS — Domain Types
 * Entidades y tipos de negocio de la plataforma YvyPass.
 */

export type UserRole = "productor" | "comprador" | "operador";

export type LivestockCategory =
  | "ternero"
  | "ternera"
  | "novillo"
  | "vaquillona"
  | "vaca"
  | "toro";

export type VerificationStatus = "declarado" | "pendiente" | "revisado";

export type LotStatus = "disponible" | "reservado" | "vendido";

export type PoolStatus =
  | "abierto"
  | "objetivo_alcanzado"
  | "en_negociacion"
  | "cerrado"
  | "cancelado";

export type OfferStatus = "pendiente" | "aceptada" | "rechazada";

export type CommercialEventType =
  | "pool_created"
  | "lot_joined"
  | "lot_left"
  | "pool_target_reached"
  | "offer_created"
  | "offer_confirmed"
  | "offer_rejected"
  | "pool_closed";

// 1. Perfil de Usuario
export interface Profile {
  id: string; // UUID matches auth.users(id)
  full_name: string;
  role: UserRole;
  phone: string | null;
  zone: string | null;
  created_at: string;
}

// 2. Establecimiento Ganadero (Farm)
export interface Farm {
  id: string;
  owner_id: string;
  name: string;
  zone: string;
  province: string;
  approximate_lat: number | null;
  approximate_lng: number | null;
  created_at: string;
}

// 3. Lote de Ganado (LivestockLot)
export interface LivestockLot {
  id: string;
  producer_id: string;
  farm_id: string;
  title: string;
  category: LivestockCategory;
  breed: string;
  head_count: number;
  average_weight_kg: number;
  electronic_tag_reference: string | null;
  verification_status: VerificationStatus;
  status: LotStatus;
  created_at: string;
}

// Vista / Lectura enriquecida del lote (por ejemplo con info de farm)
export interface LivestockLotWithFarm extends LivestockLot {
  farm?: Pick<Farm, "id" | "name" | "zone" | "province">;
  producer?: Pick<Profile, "id" | "full_name">;
}

// 4. Sales Pool (Pool de Venta Conjunta)
export interface SalesPool {
  id: string;
  title: string;
  zone: string;
  category: LivestockCategory;
  target_heads: number;
  status: PoolStatus;
  created_by: string;
  created_at: string;
}

// 5. Miembro de un Pool (Relación pool_members)
export interface PoolMember {
  id: string;
  pool_id: string;
  lot_id: string;
  joined_at: string;
}

export interface PoolMemberDetail extends PoolMember {
  lot: LivestockLotWithFarm;
}

// 6. Oferta Comercial (Offer)
export interface Offer {
  id: string;
  pool_id: string;
  buyer_id: string;
  price_per_kg: number;
  status: OfferStatus;
  created_at: string;
  buyer?: Pick<Profile, "id" | "full_name">;
}

// 7. Confirmación de Oferta por Productor
export interface OfferConfirmation {
  id: string;
  offer_id: string;
  producer_id: string;
  accepted: boolean;
  created_at: string;
  producer?: Pick<Profile, "id" | "full_name">;
}

// 8. Evento Comercial en Historial
export interface CommercialEvent {
  id: string;
  pool_id: string;
  actor_id: string;
  event_type: CommercialEventType;
  details: Record<string, unknown> | null;
  created_at: string;
  actor?: Pick<Profile, "id" | "full_name" | "role">;
}

// 9. Vista Agregada de Detalle de Pool (current_heads es calculado, no persistido)
export interface PoolDetail extends SalesPool {
  current_heads: number; // Calculado sumando head_count de lotes activos
  members: PoolMemberDetail[];
  active_offer?: (Offer & { confirmations: OfferConfirmation[] }) | null;
  history?: CommercialEvent[];
}

// 10. Resumen de Pool para listas (current_heads calculado)
export interface PoolSummary extends SalesPool {
  current_heads: number;
  members_count: number;
}

// DTOs / Inputs
export interface CreateFarmInput {
  name: string;
  zone: string;
  province?: string;
  approximate_lat?: number | null;
  approximate_lng?: number | null;
}

export interface CreateLotInput {
  farm_id: string;
  title: string;
  category: LivestockCategory;
  breed: string;
  head_count: number;
  average_weight_kg: number;
  electronic_tag_reference?: string | null;
}

export interface UpdateLotInput {
  farm_id?: string;
  title?: string;
  category?: LivestockCategory;
  breed?: string;
  head_count?: number;
  average_weight_kg?: number;
  electronic_tag_reference?: string | null;
}

export interface CreatePoolInput {
  title: string;
  zone: string;
  category: LivestockCategory;
  target_heads: number;
}

export interface JoinPoolInput {
  pool_id: string;
  lot_id: string;
}

export interface CreateOfferInput {
  price_per_kg: number;
}
