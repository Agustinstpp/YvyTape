"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page">
      <h2 style={{ fontSize: 24 }}>Algo salió mal</h2>
      <p>Puede ser la señal. Tus datos no se perdieron: probá de nuevo.</p>
      <button type="button" className="btn btn-p" onClick={reset}>
        Reintentar
      </button>
      <Link href="/" className="btn btn-s">
        Volver al inicio
      </Link>
    </main>
  );
}
