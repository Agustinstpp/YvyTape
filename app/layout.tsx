import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YvyTape — Vendé en conjunto",
  description:
    "Productores ganaderos del NEA juntan sus lotes para llegar a compradores más grandes. «Yvy» es tierra, «tape» es camino.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6B3E26",
};

// Aviso para desarrollo: sin Supabase configurado los botones parecen no hacer nada.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const sinSupabase =
  !url ||
  url.includes("your-project-ref") ||
  !anonKey ||
  anonKey.endsWith("...") ||
  (!anonKey.startsWith("eyJ") && !anonKey.startsWith("sb_publishable_") && !anonKey.startsWith("sbp_"));

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700;800&display=swap"
        />
      </head>
      <body>
        {sinSupabase ? (
          <p role="alert" style={{ margin: 0, padding: "10px 16px", background: "var(--error-fondo)", color: "var(--error)", fontWeight: 700, textAlign: "center" }}>
            Falta configurar Supabase: completá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local y reiniciá npm run dev.
            Sin eso no se puede ingresar ni ver datos.
          </p>
        ) : null}
        {children}
      </body>
    </html>
  );
}
