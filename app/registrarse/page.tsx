import Link from "next/link";
import { RegistroForm } from "./form";
import { IconArrowLeft } from "@/components/icons";

export const metadata = { title: "Crear cuenta · YvyTape" };

export default async function RegistrarsePage({ searchParams }: { searchParams: Promise<{ rol?: string }> }) {
  const { rol } = await searchParams;
  const rolInicial = rol === "comprador" ? "comprador" : "productor";

  return (
    <div className="app">
      <header className="topbar">
        <Link href="/ingresar" className="icon-btn" aria-label="Volver a ingresar">
          <IconArrowLeft size={26} strokeWidth={2.4} />
        </Link>
        <h1>Crear cuenta</h1>
      </header>
      <main className="page">
        <RegistroForm rolInicial={rolInicial} />
      </main>
    </div>
  );
}
