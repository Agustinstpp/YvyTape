import Link from "next/link";
import { Logo } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="app">
      <header className="topbar">
        <Logo size={36} />
        <h1>YvyTape</h1>
      </header>
      <main className="page">
        <h2 style={{ fontSize: 24 }}>No encontramos esta página</h2>
        <p>Puede que la venta o el lote ya no estén disponibles.</p>
        <Link href="/" className="btn btn-p">
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
