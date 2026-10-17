import type { LotStatus, PoolStatus } from "@/lib/types/domain";
import { LOT_STATUS_LABEL, POOL_STATUS_LABEL, percent, fmtInt } from "@/lib/ui/format";
import { IconCheck, IconClock, IconGroup, IconPerson, IconX } from "@/components/icons";

export function LotStatusTag({ status }: { status: LotStatus }) {
  return <span className={`tag tag-${status}`}>{LOT_STATUS_LABEL[status]}</span>;
}

export function PoolStatusTag({ status }: { status: PoolStatus }) {
  const cls =
    status === "cerrado" ? "tag-ok" : status === "cancelado" ? "tag-no" : status === "abierto" ? "tag-disponible" : "tag-pendiente";
  return <span className={`tag ${cls}`}>{POOL_STATUS_LABEL[status]}</span>;
}

export function AnswerTag({ accepted }: { accepted: boolean | null }) {
  if (accepted === true)
    return (
      <span className="tag tag-ok">
        <IconCheck size={16} strokeWidth={3} />
        Aceptó
      </span>
    );
  if (accepted === false)
    return (
      <span className="tag tag-no">
        <IconX size={16} strokeWidth={3} />
        No aceptó
      </span>
    );
  return (
    <span className="tag tag-pendiente">
      <IconClock size={16} strokeWidth={2.8} />
      Pendiente
    </span>
  );
}

export function HeadsProgress({ current, target, big = false }: { current: number; target: number; big?: boolean }) {
  const p = percent(current, target);
  const full = current >= target;
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <strong style={{ fontSize: big ? 28 : 20 }}>
          {fmtInt(current)} de {fmtInt(target)} cabezas
        </strong>
        <span className="small" style={full ? { color: "var(--exito)", fontWeight: 700 } : undefined}>
          {full ? "completa" : `faltan ${fmtInt(target - current)}`}
        </span>
      </div>
      <div className={`bar${full ? " full" : ""}${big ? " big" : ""}`} role="img" aria-label={`${current} de ${target} cabezas`}>
        <div style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export function SaleSeal({ kind, producers }: { kind: "conjunta" | "individual"; producers?: number }) {
  if (kind === "conjunta")
    return (
      <span className="seal-conjunta">
        <IconGroup size={18} strokeWidth={2.4} />
        Venta conjunta{producers ? ` · ${producers} productores` : ""}
      </span>
    );
  return (
    <span className="seal-individual">
      <IconPerson size={18} strokeWidth={2.4} />
      Lote individual
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card" style={{ borderStyle: "dashed", borderColor: "#b9a48d", background: "var(--crema)" }}>
      <strong>{title}</strong>
      {children}
    </div>
  );
}
