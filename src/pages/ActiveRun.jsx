
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import { supabase } from "@/lib/supabase";

function ActiveRun() {
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    };
    fetchCurrentUser();
  }, []);

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
    if (isRunning && currentUser) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const newPoint = [position.coords.latitude, position.coords.longitude];
          setRoute((prev) => [...prev, newPoint]);
          
          if (route.length > 0) {
            const lastPoint = route[route.length - 1];
            const newDistance = calculateDistance(lastPoint, newPoint);
            setDistance((prev) => prev + newDistance);
          }

          // Update active run in real-time
          await supabase
            .from('active_runs')
            .upsert({
              user_id: currentUser.id,
              current_location: { lat: position.coords.latitude, lng: position.coords.longitude },
              route: route,
              started_at: new Date().toISOString()
            });
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
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isRunning, currentUser, route]);

  const calculateDistance = (point1, point2) => {
    const R = 6371e3;
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

  const handleFinishRun = async () => {
    try {
      setIsRunning(false);

      if (!currentUser) {
        throw new Error("Usuário não encontrado");
      }

      // Save completed run
      const { error: runError } = await supabase
        .from('runs')
        .insert({
          user_id: currentUser.id,
          distance: distance,
          duration: time,
          route: route,
          created_at: new Date().toISOString()
        });

      if (runError) throw runError;

      // Clean up active run
      const { error: cleanupError } = await supabase
        .from('active_runs')
        .delete()
        .eq('user_id', currentUser.id);

      if (cleanupError) throw cleanupError;

      // Update user statistics
      const { data: userData } = await supabase
        .from('users')
        .select('total_runs, total_distance, total_time')
        .eq('id', currentUser.id)
        .single();

      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_runs: (userData?.total_runs || 0) + 1,
          total_distance: (userData?.total_distance || 0) + (distance / 1000), // Convert to km
          total_time: (userData?.total_time || 0) + time
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      toast({
        title: "Corrida finalizada!",
        description: `Distância: ${(distance/1000).toFixed(2)}km - Tempo: ${formatTime(time)}`,
      });
      
      navigate('/profile');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar corrida",
        variant: "destructive"
      });
    }
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
