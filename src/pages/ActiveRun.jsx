
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";

function ActiveRun() {
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    let watchId;
    if (isRunning) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPoint = [position.coords.latitude, position.coords.longitude];
          setRoute((prev) => [...prev, newPoint]);
          
          if (route.length > 0) {
            const lastPoint = route[route.length - 1];
            const newDistance = calculateDistance(lastPoint, newPoint);
            setDistance((prev) => prev + newDistance);
          }
        },
        (error) => {
          toast({
            title: "Erro",
            description: "Erro ao rastrear localização",
            variant: "destructive",
          });
        }
      );
    }
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isRunning]);

  const calculateDistance = (point1, point2) => {
    // Implementação simplificada da fórmula de Haversine
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1[0] * Math.PI/180;
    const φ2 = point2[0] * Math.PI/180;
    const Δφ = (point2[0]-point1[0]) * Math.PI/180;
    const Δλ = (point2[1]-point1[1]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishRun = () => {
    setIsRunning(false);
    const runData = {
      time,
      distance,
      route,
      date: new Date().toISOString(),
    };
    
    // Salvar no localStorage por enquanto
    const previousRuns = JSON.parse(localStorage.getItem('runs') || '[]');
    localStorage.setItem('runs', JSON.stringify([...previousRuns, runData]));
    
    toast({
      title: "Corrida finalizada!",
      description: `Distância: ${(distance/1000).toFixed(2)}km - Tempo: ${formatTime(time)}`,
    });
    
    navigate('/profile');
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        {route.length > 0 && (
          <MapContainer
            center={route[0]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Polyline positions={route} color="blue" />
          </MapContainer>
        )}
      </div>

      <div className="bg-white p-6 shadow-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Tempo</p>
            <p className="text-2xl font-bold">{formatTime(time)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Distância</p>
            <p className="text-2xl font-bold">{(distance/1000).toFixed(2)} km</p>
          </div>
        </div>
        
        <Button
          onClick={handleFinishRun}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          Finalizar Corrida
        </Button>
      </div>
    </div>
  );
}

export default ActiveRun;
