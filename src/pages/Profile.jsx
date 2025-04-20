
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchRuns();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }

      setUser(authUser);

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;
      setProfile(profile);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil",
        variant: "destructive"
      });
    }
  };

  const fetchRuns = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: runs, error } = await supabase
        .from('runs')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRuns(runs);
    } catch (error) {
      console.error('Error fetching runs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar corridas",
        variant: "destructive"
      });
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      // First, create the bucket if it doesn't exist
      const { data: buckets } = await supabase
        .storage
        .listBuckets();

      if (!buckets.find(b => b.name === 'avatars')) {
        const { error: bucketError } = await supabase
          .storage
          .createBucket('avatars', { public: true });

        if (bucketError) throw bucketError;
      }

      // Upload the file
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada!"
      });

      fetchProfile();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar foto. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleNameUpdate = async (event) => {
    try {
      const newName = event.target.value;
      if (!newName || newName === profile.name) return;

      const { error } = await supabase
        .from('users')
        .update({ name: newName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Nome atualizado!"
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar nome",
        variant: "destructive"
      });
    }
  };

  const handleCityUpdate = async (event) => {
    try {
      const newCity = event.target.value;
      if (!newCity || newCity === profile.city) return;

      const { error } = await supabase
        .from('users')
        .update({ city: newCity })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cidade atualizada!"
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cidade",
        variant: "destructive"
      });
    }
  };

  const handleVisibilityToggle = async () => {
    try {
      const newVisibility = !profile.is_visible;

      const { error } = await supabase
        .from('users')
        .update({ is_visible: newVisibility })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: newVisibility ? "Você está visível no mapa" : "Você está invisível no mapa"
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar visibilidade",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao sair",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 safe-area-top safe-area-bottom">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={profile?.avatar_url || "https://via.placeholder.com/100"}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
              <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </label>
            </div>
            <div className="flex-1">
              <input
                type="text"
                defaultValue={profile?.name || ""}
                onBlur={handleNameUpdate}
                placeholder="Seu nome"
                className="text-xl font-bold w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-600 focus:outline-none"
              />
              <input
                type="text"
                defaultValue={profile?.city || ""}
                onBlur={handleCityUpdate}
                placeholder="Sua cidade"
                className="text-gray-600 w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-600 focus:outline-none mt-2"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={profile?.is_visible}
                onCheckedChange={handleVisibilityToggle}
              />
              <span className="text-sm text-gray-600">
                {profile?.is_visible ? "Visível no mapa" : "Invisível no mapa"}
              </span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              Sair
            </Button>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-600 text-sm">Total de Corridas</p>
            <p className="text-2xl font-bold">{profile?.total_runs || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-600 text-sm">Distância Total</p>
            <p className="text-2xl font-bold">{((profile?.total_distance || 0)).toFixed(1)} km</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-600 text-sm">Tempo Total</p>
            <p className="text-2xl font-bold">{formatTime(profile?.total_time || 0)}</p>
          </div>
        </motion.div>

        {/* Run History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-bold mb-4">Histórico de Corridas</h2>
          <div className="space-y-4">
            {runs.map((run) => (
              <div
                key={run.id}
                className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600">{formatDate(run.created_at)}</p>
                    <p className="font-medium">{(run.distance / 1000).toFixed(2)} km</p>
                  </div>
                  <p className="text-gray-600">{formatTime(run.duration)}</p>
                </div>
              </div>
            ))}
            {runs.length === 0 && (
              <p className="text-gray-500 text-center">Nenhuma corrida registrada ainda</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Profile;
