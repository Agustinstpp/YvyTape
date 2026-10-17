import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { mensajes } from "@/lib/front/mensajes";
import { IconLock } from "@/components/icons";
import { ROLE_LABEL, fmtWhen } from "@/lib/ui/format";
import { EnviarForm } from "./form";

export const metadata = { title: "Conversación · YvyTape" };

export default async function ConversacionPage({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await requireProfile();
  const { id } = await params;
  const conv = await mensajes.conversacion(perfil, id);
  if (!conv) notFound();
  await mensajes.marcarLeida(perfil, id);

  return (
    <AppShell title={conv.asunto} subtitle={conv.contexto} back={{ href: "/mensajes", label: "Volver a mensajes" }} perfil={perfil} current="mensajes">
      <p className="alert alert-info" style={{ fontSize: 15 }}>
        <IconLock size={22} />
        Todo queda en YvyTape. No se pueden compartir teléfonos, correos ni enlaces.
      </p>
      <p className="small">
        Participan: {conv.participantes.map((p) => `${p.nombre} (${ROLE_LABEL[p.rol].toLowerCase()})`).join(", ")}.
      </p>
      <ol aria-label="Mensajes" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {conv.mensajes.map((m) => {
          const mio = m.autorId === perfil.id;
          return (
            <li key={m.id} className={`bubble${mio ? " mine" : ""}`}>
              <span className="who">{mio ? "Vos" : `${m.autor.nombre} · ${ROLE_LABEL[m.autor.rol]}`}</span>
              <span style={{ whiteSpace: "pre-wrap" }}>{m.texto}</span>
              <span className="small">{fmtWhen(m.fecha)}</span>
            </li>
          );
        })}
      </ol>
      <EnviarForm conversacionId={conv.id} />
    </AppShell>
  );
}
