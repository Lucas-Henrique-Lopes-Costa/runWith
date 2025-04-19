
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

function PrivateRoute({ children }) {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default PrivateRoute;
