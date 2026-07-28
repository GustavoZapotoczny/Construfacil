/** Cabeçalhos de segurança aplicados a todas as rotas. */
const securityHeaders = [
  // Impede que o site seja embutido em <iframe> de outro domínio (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Impede o navegador de "adivinhar" o content-type (MIME sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza a URL completa como referer para outros sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs sensíveis do navegador que o app não usa.
  // (payment fica no padrão do navegador para não interferir no checkout do MP.)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
