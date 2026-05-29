"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3333";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  stock: number;
  category: string;
  createdAt: string;
  updatedAt: string;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  user: AuthUser;
  token: string;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
};

const emptyProductForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
};

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Erro ao acessar a API.");
  }

  return data as T;
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(token);

  const submitLabel = useMemo(() => {
    return editingId ? "Salvar produto" : "Criar produto";
  }, [editingId]);

  async function loadProducts() {
    const data = await apiRequest<Product[]>("/products");
    setProducts(data);
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("joalherias-token");

    if (savedToken) {
      setToken(savedToken);
    }

    loadProducts().catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : "Erro ao listar.");
    });
  }, []);

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

      setToken(data.token);
      localStorage.setItem("joalherias-token", data.token);
      setMessage(`Sessao iniciada para ${data.user.name}.`);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro na autenticacao.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const path = editingId ? `/products/${editingId}` : "/products";
      const method = editingId ? "PUT" : "POST";

      await apiRequest<Product>(path, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          category: productForm.category,
        }),
      });

      setProductForm(emptyProductForm);
      setEditingId(null);
      setMessage(editingId ? "Produto atualizado." : "Produto criado.");
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setMessage("");

    try {
      await apiRequest<null>(`/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Produto removido.");
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao remover.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
      category: product.category,
    });
  }

  function handleLogout() {
    setToken("");
    localStorage.removeItem("joalherias-token");
    setMessage("Sessao encerrada.");
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-3 border-b border-zinc-300 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              CRUD Joalherias
            </p>
            <h1 className="text-3xl font-semibold tracking-normal">
              Produtos e autenticacao
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm">
              {isAuthenticated ? "Token ativo" : "Sem token"}
            </span>
            {isAuthenticated && (
              <button
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                type="button"
                onClick={handleLogout}
              >
                Sair
              </button>
            )}
          </div>
        </header>

        {message && (
          <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col gap-6">
            <form
              className="rounded border border-zinc-300 bg-white p-4 shadow-sm"
              onSubmit={handleAuthSubmit}
            >
              <div className="mb-4 flex rounded border border-zinc-300 p-1">
                <button
                  className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
                    authMode === "login"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                  type="button"
                  onClick={() => setAuthMode("login")}
                >
                  Login
                </button>
                <button
                  className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
                    authMode === "register"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                  type="button"
                  onClick={() => setAuthMode("register")}
                >
                  Cadastro
                </button>
              </div>

              <div className="grid gap-3">
                {authMode === "register" && (
                  <label className="grid gap-1 text-sm font-medium">
                    Nome
                    <input
                      className="rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600"
                      value={authForm.name}
                      onChange={(event) =>
                        setAuthForm({ ...authForm, name: event.target.value })
                      }
                    />
                  </label>
                )}

                <label className="grid gap-1 text-sm font-medium">
                  E-mail
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600"
                    type="email"
                    value={authForm.email}
                    onChange={(event) =>
                      setAuthForm({ ...authForm, email: event.target.value })
                    }
                  />
                </label>

                <label className="grid gap-1 text-sm font-medium">
                  Senha
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600"
                    type="password"
                    value={authForm.password}
                    onChange={(event) =>
                      setAuthForm({ ...authForm, password: event.target.value })
                    }
                  />
                </label>

                <button
                  className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                  disabled={loading}
                  type="submit"
                >
                  {authMode === "login" ? "Entrar" : "Cadastrar"}
                </button>
              </div>
            </form>

            <form
              className="rounded border border-zinc-300 bg-white p-4 shadow-sm"
              onSubmit={handleProductSubmit}
            >
              <h2 className="mb-4 text-lg font-semibold">
                {editingId ? "Editar produto" : "Novo produto"}
              </h2>

              <div className="grid gap-3">
                <label className="grid gap-1 text-sm font-medium">
                  Nome
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600"
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        name: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="grid gap-1 text-sm font-medium">
                  Descricao
                  <textarea
                    className="min-h-20 rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600"
                    value={productForm.description}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        description: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-medium min-w-0">
                    Preco
                    <input
                      className="w-full rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600"
                      min="0"
                      step="0.01"
                      type="number"
                      value={productForm.price}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          price: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-sm font-medium min-w-0">
                    Estoque
                    <input
                      className="w-full rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600"
                      min="0"
                      type="number"
                      value={productForm.stock}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          stock: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <label className="grid gap-1 text-sm font-medium">
                  Categoria
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600"
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        category: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    className="flex-1 rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                    disabled={loading || !isAuthenticated}
                    type="submit"
                  >
                    {submitLabel}
                  </button>

                  {editingId && (
                    <button
                      className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setProductForm(emptyProductForm);
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          <section className="rounded border border-zinc-300 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-300 px-4 py-3">
              <h2 className="text-lg font-semibold">Produtos</h2>
              <button
                className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100"
                type="button"
                onClick={() => loadProducts()}
              >
                Atualizar
              </button>
            </div>

            <div className="grid divide-y divide-zinc-200">
              {products.length === 0 ? (
                <p className="px-4 py-6 text-sm text-zinc-600">
                  Nenhum produto cadastrado.
                </p>
              ) : (
                products.map((product) => (
                  <article
                    className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto]"
                    key={product.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900">
                          {product.category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        {product.description || "Sem descricao"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <span className="font-medium">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-zinc-600">
                          Estoque: {product.stock}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <button
                        className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100"
                        type="button"
                        onClick={() => handleEdit(product)}
                      >
                        Editar
                      </button>
                      <button
                        className="rounded bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                        disabled={!isAuthenticated || loading}
                        type="button"
                        onClick={() => handleDelete(product.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
