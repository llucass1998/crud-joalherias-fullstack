"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  user: AuthUser;
  token: string;
};

// Nossa ponte de comunicação com a API
async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  const response = await fetch(new URL(path, API_URL).toString(), {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Erro ao acessar a API.");
  }

  return data as T;
}

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Se já tem token, manda direto pro painel
  useEffect(() => {
    const savedToken = localStorage.getItem("joalherias-token");
    if (savedToken) {
      router.push("/dashboard");
    }
  }, [router]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const body =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : authForm;

      const data = await apiRequest<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Salva o crachá e redireciona o usuário para o Estoque!
      localStorage.setItem("joalherias-token", data.token);
      router.push("/dashboard");
      
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro na autenticação.");
      setLoading(false); // Só desativa o loading se der erro, senão a tela pisca antes de mudar
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-emerald-700">CRUD Joalherias</p>
          <h1 className="text-3xl font-semibold tracking-normal">Acesso ao Sistema</h1>
        </div>

        {message && (
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 text-center">
            {message}
          </div>
        )}

        <form
          className="rounded-lg border border-zinc-300 bg-white p-6 shadow-md"
          onSubmit={handleAuthSubmit}
        >
          <div className="mb-6 flex rounded bg-zinc-100 p-1">
            <button
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                authMode === "login"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
              type="button"
              onClick={() => {
                setAuthMode("login");
                setMessage("");
              }}
            >
              Login
            </button>
            <button
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                authMode === "register"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
              type="button"
              onClick={() => {
                setAuthMode("register");
                setMessage("");
              }}
            >
              Criar Conta
            </button>
          </div>

          <div className="grid gap-4">
            {authMode === "register" && (
              <label className="grid gap-1.5 text-sm font-medium">
                Nome completo
                <input
                  className="rounded border border-zinc-300 px-3 py-2.5 font-normal outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, name: event.target.value })
                  }
                  required={authMode === "register"}
                />
              </label>
            )}

            <label className="grid gap-1.5 text-sm font-medium">
              E-mail corporativo
              <input
                className="rounded border border-zinc-300 px-3 py-2.5 font-normal outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm({ ...authForm, email: event.target.value })
                }
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              Senha de acesso
              <input
                className="rounded border border-zinc-300 px-3 py-2.5 font-normal outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({ ...authForm, password: event.target.value })
                }
                required
              />
            </label>

            <button
              className="mt-2 rounded bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={loading}
              type="submit"
            >
              {loading ? "Processando..." : authMode === "login" ? "Entrar no Sistema" : "Finalizar Cadastro"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}