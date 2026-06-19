import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import escudoImg from "../assets/escudo.svg";
import {
  AuthService,
  getApiErrorMessage,
  SessionService,
} from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (SessionService.isAuthenticated() && SessionService.hasDashboardAccess()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await AuthService.login(username.trim(), password);
      const destination = location.state?.from || "/dashboard";
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(
        loginError.response?.status === 401
          ? "Usuário ou senha inválidos. Verifique os dados informados."
          : getApiErrorMessage(loginError),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background-light md:flex-row">
      <div className="flex min-h-48 items-center justify-center bg-senac-blue shadow-lg md:min-h-screen md:w-1/2 md:rounded-r-[50px]">
        <img
          src={escudoImg}
          alt="Escudo de Segurança"
          className="w-28 h-auto drop-shadow-md md:w-40"
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 md:w-1/2 md:px-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-2 text-4xl font-bold text-senac-blue-title">
            Fazer login
          </h1>
          <p className="mb-10 text-lg text-gray-800">
            Acesso da coordenação e portaria
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <label className="text-left text-sm font-semibold text-gray-700">
              Usuário
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                disabled={loading}
                className="mt-1 w-full rounded-3xl bg-gray-200 px-5 py-3 text-gray-700 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-senac-blue disabled:opacity-60"
              />
            </label>

            <label className="text-left text-sm font-semibold text-gray-700">
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                className="mt-1 w-full rounded-3xl bg-gray-200 px-5 py-3 text-gray-700 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-senac-blue disabled:opacity-60"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full cursor-pointer rounded-3xl bg-senac-blue py-3 text-lg font-semibold text-white shadow-md transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
