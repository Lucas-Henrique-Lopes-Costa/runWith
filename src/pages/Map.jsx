
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

function Map() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setCurrentUser(profile);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchCurrentUser();
    getCurrentLocation();
    subscribeToActiveUsers();

    return () => {
      // Cleanup subscriptions
    };
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLoading(false);
        },
        (error) => {
          toast({
            title: "Erro",
            description: "Não foi possível obter sua localização",
            variant: "destructive",
          });
          setLoading(false);
        }
      );
    } else {
      toast({
        title: "Erro",
        description: "Seu navegador não suporta geolocalização",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const subscribeToActiveUsers = async () => {
    try {
      const channel = supabase
        .channel('active_users')
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

      fetchActiveUsers();
    } catch (error) {
      console.error('Error subscribing to active users:', error);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const { data: activeRuns } = await supabase
        .from('active_runs')
        .select(`
          *,
          users:user_id (
            name,
            avatar_url,
            is_visible
          )
        `);

      const visibleRuns = activeRuns?.filter(run => run.users?.is_visible) || [];
      setActiveUsers(visibleRuns);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  const startRun = async () => {
    if (!userLocation) {
      toast({
        title: "Erro",
        description: "Aguarde a localização ser obtida",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('active_runs')
        .insert({
          user_id: currentUser.id,
          current_location: { lat: userLocation[0], lng: userLocation[1] },
          route: [userLocation],
          started_at: new Date().toISOString()
        });

      if (error) throw error;

      navigate('/run');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao iniciar corrida",
        variant: "destructive",
      });
    }
  };

  const handleJoinRun = async (activeRun) => {
    if (!userLocation) {
      toast({
        title: "Erro",
        description: "Aguarde a localização ser obtida",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('active_runs')
        .insert({
          user_id: currentUser.id,
          current_location: { lat: userLocation[0], lng: userLocation[1] },
          route: [userLocation],
          started_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Você está correndo com ${activeRun.users.name}!`,
      });

      navigate('/run');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao juntar-se à corrida",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen relative">
      {userLocation && (
        <MapContainer
          center={userLocation}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Current user marker */}
          <Marker position={userLocation}>
            <Popup>Você está aqui</Popup>
          </Marker>

          {/* Active users markers */}
          {activeUsers.map((activeRun) => (
            <Marker
              key={activeRun.id}
              position={[
                activeRun.current_location.lat,
                activeRun.current_location.lng
              ]}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{activeRun.users.name}</h3>
                  <Button
                    onClick={() => handleJoinRun(activeRun)}
                    className="mt-2 w-full"
                  >
                    Correr Junto
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Profile shortcut */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="absolute top-4 right-4 z-[1000]"
      >
        <Button
          onClick={() => navigate('/profile')}
          className="shadow-lg"
          style={{ backgroundColor: "#0000;" }}
        >
          <img 
            className="w-12 h-12 rounded-full"
            alt={currentUser?.name || "Profile"}
            src={currentUser?.avatar_url || "https://via.placeholder.com/100"}
          />
        </Button>
      </motion.div>

      {/* Start run button */}
      <div className="absolute bottom-0 left-0 right-0 safe-area-bottom flex justify-center pb-8 z-[1000]">
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
