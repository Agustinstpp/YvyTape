import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { mensajes } from "@/lib/front/mensajes";
import { avisosDelProductor } from "@/lib/front/derivados";
import { IconBell, IconChat, IconCheck, IconPlus } from "@/components/icons";
import { fmtWhen } from "@/lib/ui/format";

export const metadata = { title: "Mensajes · YvyTape" };

export default async function MensajesPage() {
  const perfil = await requireProfile();
  const [conversaciones, avisos] = await Promise.all([
    mensajes.bandeja(perfil),
    perfil.role === "productor" ? avisosDelProductor(perfil) : Promise.resolve([]),
  ]);

  return (
    <AppShell title="Mensajes" subtitle="Avisos y consultas, todo dentro de YvyTape" perfil={perfil} current="mensajes">
      {avisos.length > 0 ? (
        <>
          <h2>Avisos</h2>
          {avisos.map((a) => (
            <Link key={a.id} href={a.href} className={`item${a.urgente ? " unread" : ""}`}>
              <span style={{ color: a.urgente ? "var(--marron)" : "var(--exito)" }}>
                {a.urgente ? <IconBell size={28} /> : <IconCheck size={28} strokeWidth={2.6} />}
              </span>
              <span style={{ flex: 1 }}>
                <strong style={{ fontSize: 17 }}>{a.titulo}</strong>
                <br />
                {a.texto}
              </span>
              {a.urgente ? <span className="dot" aria-label="Sin responder" /> : null}
            </Link>
          ))}
        </>
      ) : null}

      <h2 style={{ marginTop: 8 }}>Conversaciones</h2>
      {mensajes.esDemo ? (
        <p className="tag" style={{ background: "var(--crema)", border: "2px dotted var(--marron)", color: "var(--marron)", alignSelf: "flex-start", whiteSpace: "normal" }}>
          Mensajes de demostración: todavía no se guardan
        </p>
      ) : null}
      {conversaciones.map((c) => (
        <Link key={c.id} href={`/mensajes/${c.id}`} className={`item${c.sinLeer ? " unread" : ""}`}>
          <span style={{ color: "var(--marron)" }}>
            <IconChat size={28} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontSize: 17 }}>{c.asunto}</strong>
            <br />
            <span className="small">{c.contexto}</span>
            {c.ultimo ? (
              <>
                <br />
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.ultimo.autorId === perfil.id ? "Vos" : c.ultimo.autor.nombre}: «{c.ultimo.texto}»
                </span>
                <span className="small">{fmtWhen(c.ultimo.fecha)}</span>
              </>
            ) : null}
          </span>
          {c.sinLeer ? <span className="dot" aria-label="Sin leer" /> : null}
        </Link>
      ))}

      <Link href="/mensajes/nueva" className="btn btn-s">
        <IconPlus size={24} strokeWidth={2.4} />
        Nueva consulta al equipo
      </Link>
    </AppShell>
  );
}
