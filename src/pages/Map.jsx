
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { User, MapPin } from "lucide-react";

function LocationMarker({ position, onPositionChange }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [position]);

  return null;
}

function Map() {
  const [position, setPosition] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(data);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const newPosition = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPosition);

          if (currentUser) {
            // Update user's current location in active_runs
            await supabase
              .from('active_runs')
              .upsert({
                user_id: currentUser.id,
                current_location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
              });
          }
        },
        (error) => {
          toast({
            title: "Erro",
            description: "Não foi possível obter sua localização.",
            variant: "destructive",
          });
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      const { data: activeRuns } = await supabase
        .from('active_runs')
        .select(`
          *,
          users:user_id (
            name,
            email,
            activity,
            avatar_url,
            is_visible
          )
        `)
        .not('users.is_visible', 'eq', false);

      setActiveUsers(activeRuns || []);
    };

    // Initial fetch
    fetchActiveUsers();

    // Set up real-time subscription using channel
    const channel = supabase
      .channel('active_runs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_runs'
        },
        (payload) => {
          fetchActiveUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const startRun = () => {
    navigate("/run");
  };

  const joinRun = async (userId) => {
    // Logic to join another user's run
    toast({
      title: "Conectando...",
      description: "Preparando para correr junto!",
    });
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
      {/* Profile Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 z-[1000]"
      >
        <Button
          onClick={() => navigate('/profile')}
          className="rounded-full w-12 h-12 bg-white shadow-lg hover:bg-gray-100"
        >
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="w-6 h-6 text-gray-600" />
          )}
        </Button>
      </motion.div>

      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <LocationMarker position={position} />

        {/* Current user marker */}
        <Marker position={position}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">Você está aqui!</p>
              <p className="text-sm text-gray-600">
                {currentUser?.activity === 'running' ? 'Correndo' : 'Caminhando'}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Other active users */}
        {activeUsers.map((activeRun) => {
          if (
            activeRun.current_location &&
            activeRun.user_id !== currentUser?.id &&
            activeRun.users?.is_visible
          ) {
            return (
              <Marker
                key={activeRun.id}
                position={[
                  activeRun.current_location.lat,
                  activeRun.current_location.lng
                ]}
              >
                <Popup>
                  <div className="text-center p-2">
                    <h3 className="font-semibold">{activeRun.users?.name || 'Corredor'}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {activeRun.users?.activity === 'running' ? 'Correndo' : 'Caminhando'}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => joinRun(activeRun.user_id)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Correr Junto
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
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
