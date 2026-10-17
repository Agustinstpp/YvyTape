import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile, homeFor } from "@/lib/session";
import { Logo } from "@/components/icons";
import { IngresarForm } from "./form";

export const metadata = { title: "Ingresar · YvyTape" };

export default async function IngresarPage() {
  const perfil = await getSessionProfile();
  if (perfil) redirect(homeFor(perfil.role));

  return (
    <div className="app">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="YvyTape, inicio">
          <Logo size={36} />
          YvyTape
        </Link>
      </header>
      <main className="page">
        <h1 style={{ fontSize: 34 }}>Entrá a YvyTape</h1>
        <IngresarForm />
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--texto-apoyo)" }}>
          <span style={{ flex: 1, height: 2, background: "var(--borde)" }} />
          ¿Es tu primera vez?
          <span style={{ flex: 1, height: 2, background: "var(--borde)" }} />
        </div>
        <Link href="/registrarse?rol=productor" className="btn btn-s">
          Crear cuenta de productor
        </Link>
        <Link href="/registrarse?rol=comprador" className="btn btn-s">
          Crear cuenta de comprador
        </Link>
        <p className="card note" style={{ fontSize: 17 }}>
          Si te ayuda un familiar, puede crear la cuenta con tus datos. En YvyTape no pedimos ni mostramos tu teléfono: todo se habla por Mensajes.
        </p>
      </main>
    </div>
  );
}
