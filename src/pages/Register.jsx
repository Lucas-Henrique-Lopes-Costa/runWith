import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    city: "",
    activity: "running",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Create the user profile in the users table
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          age: parseInt(formData.age),
          city: formData.city,
          activity: formData.activity,
        },
      ]);

      if (profileError) throw profileError;

      toast({
        title: "Registro concluído!",
        description: "Bem-vindo ao RunWith! Por favor, verifique seu email.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Erro no registro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-8"
      >
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Criar Conta
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              name="name"
              placeholder="Nome completo"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              name="password"
              type="password"
              placeholder="Senha"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              name="age"
              type="number"
              placeholder="Idade"
              value={formData.age}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              name="city"
              placeholder="Cidade"
              value={formData.city}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant={formData.activity === "running" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, activity: "running" })}
              disabled={loading}
            >
              Corrida
            </Button>
            <Button
              type="button"
              variant={formData.activity === "walking" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData({ ...formData, activity: "walking" })}
              disabled={loading}
            >
              Caminhada
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;
