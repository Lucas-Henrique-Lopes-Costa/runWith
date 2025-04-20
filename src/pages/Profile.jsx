
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Camera, Save, User, Clock, MapPin } from "lucide-react";

function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [runs, setRuns] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    is_visible: true
  });

  useEffect(() => {
    fetchProfile();
    fetchRuns();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser(profile);
        setFormData({
          name: profile.name || "",
          city: profile.city || "",
          is_visible: profile.is_visible !== false
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userRuns } = await supabase
          .from('runs')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        setRuns(userRuns || []);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar corridas",
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
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleAvatarUpload = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

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
      toast({
        title: "Erro",
        description: "Erro ao atualizar foto",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          city: formData.city,
          is_visible: formData.is_visible
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado!"
      });
      
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
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
        description: "Erro ao fazer logout",
        variant: "destructive"
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar Upload */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-lg cursor-pointer">
                <Camera className="w-5 h-5 text-gray-600" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            {editMode ? (
              <div className="space-y-4 w-full">
                <Input
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  placeholder="Sua cidade"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Visível no mapa</label>
                  <Switch
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                  />
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold">{user?.name || "Sem nome"}</h2>
                <p className="text-gray-500">{user?.city || "Cidade não informada"}</p>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  className="mt-4"
                >
                  Editar Perfil
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow p-4 text-center"
          >
            <p className="text-gray-500 text-sm">Total de Corridas</p>
            <p className="text-2xl font-bold">{user?.total_runs || 0}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow p-4 text-center"
          >
            <p className="text-gray-500 text-sm">Distância Total</p>
            <p className="text-2xl font-bold">{(user?.total_distance || 0).toFixed(1)} km</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow p-4 text-center"
          >
            <p className="text-gray-500 text-sm">Tempo Total</p>
            <p className="text-2xl font-bold">{formatTime(user?.total_time)}</p>
          </motion.div>
        </div>

        {/* Run History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold mb-4">Histórico de Corridas</h3>
          <div className="space-y-4">
            {runs.length === 0 ? (
              <p className="text-center text-gray-500">Nenhuma corrida registrada ainda</p>
            ) : (
              runs.map((run) => (
                <div
                  key={run.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{formatTime(run.duration)}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(run.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{(run.distance / 1000).toFixed(2)} km</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Voltar ao Mapa
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
