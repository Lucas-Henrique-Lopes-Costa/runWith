
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const runs = JSON.parse(localStorage.getItem('runs') || '[]');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const totalDistance = runs.reduce((acc, run) => acc + run.distance, 0);
  const totalTime = runs.reduce((acc, run) => acc + run.time, 0);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Perfil Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.email}</h2>
              <p className="text-gray-500">Corredor</p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-gray-500 text-sm">Total de Corridas</p>
            <p className="text-2xl font-bold">{runs.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-gray-500 text-sm">Distância Total</p>
            <p className="text-2xl font-bold">{(totalDistance/1000).toFixed(1)} km</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-gray-500 text-sm">Tempo Total</p>
            <p className="text-2xl font-bold">{formatTime(totalTime)}</p>
          </div>
        </div>

        {/* Histórico de Corridas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Histórico de Corridas</h3>
          <div className="space-y-4">
            {runs.map((run, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">
                      {new Date(run.date).toLocaleDateString()}
                    </p>
                    <p className="font-medium">
                      {(run.distance/1000).toFixed(2)} km
                    </p>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatTime(run.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Iniciar Nova Corrida
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
