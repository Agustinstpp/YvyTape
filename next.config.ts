import type { NextConfig } from "next";

// TODO(geo): sacar estos redirects cuando el mapa enlace a /ofertas/lote/:id y /ventas-conjuntas/:id.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Los marcadores del mapa (features/geography) enlazan a /lotes/:id y /pools/:id;
  // se redirigen a las pantallas del front para no tocar ese módulo.
  async redirects() {
    return [
      { source: "/lotes/:id", destination: "/ofertas/lote/:id", permanent: false },
      { source: "/pools/:id", destination: "/ventas-conjuntas/:id", permanent: false },
    ];
  },
};

export default nextConfig;
