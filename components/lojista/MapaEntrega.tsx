"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Circle, CircleMarker, useMap } from "react-leaflet";

/** Reenquadra o mapa para caber o círculo sempre que muda o ponto ou o raio. */
function Ajustar({ lat, lon, raioKm }: { lat: number; lon: number; raioKm: number }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLng(lat, lon).toBounds(raioKm * 2.6 * 1000);
    map.fitBounds(bounds);
  }, [lat, lon, raioKm, map]);
  return null;
}

/**
 * Mapa da área de entrega. O círculo (verde translúcido) e o marcador ficam
 * presos às coordenadas do endereço da loja — continuam no lugar certo ao
 * dar zoom ou arrastar o mapa.
 */
export default function MapaEntrega({
  lat,
  lon,
  raioKm,
}: {
  lat: number;
  lon: number;
  raioKm: number;
}) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-64 w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle
        center={[lat, lon]}
        radius={raioKm * 1000}
        pathOptions={{
          color: "#16a34a",
          fillColor: "#22c55e",
          fillOpacity: 0.25,
          weight: 2,
        }}
      />
      <CircleMarker
        center={[lat, lon]}
        radius={6}
        pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#f97316", fillOpacity: 1 }}
      />
      <Ajustar lat={lat} lon={lon} raioKm={raioKm} />
    </MapContainer>
  );
}
