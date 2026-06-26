"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, RefreshCw } from "lucide-react";
import { getMinhaLoja, atualizarLoja } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { SubHeader } from "@/components/lojista/SubHeader";
import { Botao } from "@/components/ui/Botao";
import { Carregando } from "@/components/ui/Estados";

// Mapa é client-only (Leaflet usa window) — carrega sem SSR.
const MapaEntrega = dynamic(
  () => import("@/components/lojista/MapaEntrega"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center bg-stone-100 text-sm text-stone-400">
        Carregando mapa…
      </div>
    ),
  },
);

const CENTRO_PADRAO = { lat: -25.4284, lon: -49.2733 }; // Curitiba

export default function EntregaPage() {
  const { data: loja, loading } = useAsync(getMinhaLoja, []);

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [raio, setRaio] = useState(5);
  const [endereco, setEndereco] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erroGeo, setErroGeo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);
  const geocodouAuto = useRef(false);

  // Geocodifica um endereço e atualiza o ponto do mapa.
  async function geocodar(addr: string): Promise<boolean> {
    if (!addr.trim()) return false;
    setErroGeo("");
    setBuscando(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`,
      );
      const data = (await r.json()) as { lat: string; lon: string }[];
      if (!data.length) {
        setErroGeo("Endereço não encontrado. Tente incluir cidade e estado.");
        return false;
      }
      setCoords({ lat: Number(data[0].lat), lon: Number(data[0].lon) });
      setOk(false);
      return true;
    } catch {
      setErroGeo("Não foi possível localizar o endereço agora.");
      return false;
    } finally {
      setBuscando(false);
    }
  }

  // Ao carregar: usa coords salvas; senão geocodifica o endereço da loja.
  useEffect(() => {
    if (!loja) return;
    setEndereco(loja.endereco || "");
    if (loja.raioEntregaKm) setRaio(loja.raioEntregaKm);

    if (loja.latitude != null && loja.longitude != null) {
      setCoords({ lat: loja.latitude, lon: loja.longitude });
    } else if (loja.endereco && !geocodouAuto.current) {
      geocodouAuto.current = true;
      geocodar(loja.endereco);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loja]);

  async function salvar() {
    if (!loja || !coords) return;
    setSalvando(true);
    setOk(false);
    try {
      await atualizarLoja(loja.id, {
        latitude: coords.lat,
        longitude: coords.lon,
        raio_entrega_km: raio,
      });
      setOk(true);
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <Carregando />;

  const ponto = coords ?? CENTRO_PADRAO;
  const temLocal = coords !== null;

  return (
    <div className="min-h-screen pb-28">
      <SubHeader titulo="Área de entrega" />

      {/* Endereço da loja (base do raio) */}
      <div className="px-4 pt-4">
        <span className="mb-1.5 block text-sm font-medium text-stone-700">
          Endereço da loja
        </span>
        <p className="mb-2 text-xs text-stone-500">
          O raio de entrega é centrado neste endereço. Edite no campo abaixo e
          clique em atualizar para reposicionar.
        </p>
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3">
            <MapPin size={18} className="text-stone-400" />
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, cidade — estado"
              className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
            />
          </div>
          <Botao
            variante="secundario"
            onClick={() => geocodar(endereco)}
            disabled={buscando}
          >
            <RefreshCw size={16} className={buscando ? "animate-spin" : ""} />
            Atualizar
          </Botao>
        </div>
        {erroGeo && <p className="mt-1.5 text-xs text-red-600">{erroGeo}</p>}
        {!temLocal && !buscando && (
          <p className="mt-1.5 text-xs text-amber-600">
            Defina o endereço da loja para posicionar a área de entrega.
          </p>
        )}
      </div>

      {/* Mapa com o raio ancorado no endereço */}
      <div className="px-4 pt-3">
        <div className="overflow-hidden rounded-2xl border border-stone-200">
          <MapaEntrega lat={ponto.lat} lon={ponto.lon} raioKm={raio} />
        </div>
        <p className="mt-1.5 text-center text-[11px] text-stone-400">
          🟠 Endereço da loja · 🟢 área de entrega · mapa OpenStreetMap
        </p>
      </div>

      {/* Raio de entrega */}
      <div className="px-4 pt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">
            Raio de entrega
          </span>
          <span className="text-sm font-bold text-orange-600">{raio} km</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={raio}
          onChange={(e) => {
            setRaio(Number(e.target.value));
            setOk(false);
          }}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-[11px] text-stone-400">
          <span>1 km</span>
          <span>30 km</span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-100 bg-white p-4 md:left-60 md:max-w-6xl">
        {ok && (
          <p className="mb-2 text-center text-xs font-medium text-green-600">
            Área de entrega salva! ✓
          </p>
        )}
        <Botao bloco onClick={salvar} disabled={salvando || !temLocal}>
          {salvando ? "Salvando…" : "Salvar área de entrega"}
        </Botao>
      </div>
    </div>
  );
}
