
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // For now, using localStorage for demonstration
    if (email && password) {
      localStorage.setItem("user", JSON.stringify({ email }));
      toast({
        title: "Login bem-sucedido!",
        description: "Bem-vindo de volta!",
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-8"
      >
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Bem-vindo ao RunTogether
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Entrar
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Não tem uma conta?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Registre-se
            </Link>
          </p>
        </div>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Ou continue com
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast({
                title: "Em breve!",
                description: "Login com Google estará disponível em breve.",
              })}
            >
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast({
                title: "Em breve!",
                description: "Login com Facebook estará disponível em breve.",
              })}
            >
              Facebook
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast({
                title: "Em breve!",
                description: "Login com Apple estará disponível em breve.",
              })}
            >
              Apple
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
