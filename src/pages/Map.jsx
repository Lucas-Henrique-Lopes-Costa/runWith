
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import "leaflet/dist/leaflet.css";

function Map() {
  const [position, setPosition] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          toast({
            title: "Erro",
            description: "Não foi possível obter sua localização.",
            variant: "destructive",
          });
        }
      );
    }
  }, []);

  const startRun = () => {
    navigate("/run");
  };

  if (!position) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Obtendo sua localização...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen relative">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>Você está aqui!</Popup>
        </Marker>
      </MapContainer>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000]">
        <Button
          onClick={startRun}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full shadow-lg"
        >
          Iniciar Corrida
        </Button>
      </div>
    </div>
  );
}

export default Map;
