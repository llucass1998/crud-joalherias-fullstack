"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

const productSchema = z.object({
  name: z.string().min(3, "O nome precisa ter pelo menos 3 letras."),
  description: z.string().optional(),
  price: z.coerce.number().positive("O preço deve ser maior que zero."),
  stock: z.coerce.number().min(0, "O estoque não pode ser negativo."),
  category: z.string().min(2, "Informe a categoria (ex: Anel)."),
});

type ProductFormData = z.infer<typeof productSchema>;

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  stock: number;
  category: string;
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  }
  const response = await fetch(new URL(path, API_URL).toString(), { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || "Erro ao acessar a API.");
  return data as T;
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(token);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
    },
  });

  async function loadProducts(currentToken: string) {
    try {
      const data = await apiRequest<Product[]>("/products", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setProducts(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao listar produtos.");
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("joalherias-token");
    if (!savedToken) {
      router.push("/");
      return;
    }
    setToken(savedToken);
    loadProducts(savedToken);
  }, [router]);

  const onSubmitForm: SubmitHandler<ProductFormData> = async (data) => {
    setLoading(true);

    try {
      const path = editingId ? `/products/${editingId}` : "/products";
      const method = editingId ? "PUT" : "POST";

      await apiRequest<Product>(path, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      reset();
      setEditingId(null);
      toast.success(editingId ? "Joia atualizada no estoque!" : "Joia adicionada ao catálogo!");
      await loadProducts(token);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar o produto.");
    } finally {
      setLoading(false);
    }
  };

  async function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir esta joia?")) return;
    setLoading(true);
    try {
      await apiRequest<null>(`/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Joia removida do estoque.");
      await loadProducts(token);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setValue("name", product.name);
    setValue("description", product.description || "");
    setValue("price", Number(product.price));
    setValue("stock", product.stock);
    setValue("category", product.category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLogout() {
    setToken("");
    localStorage.removeItem("joalherias-token");
    router.push("/");
  }

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <nav className="bg-white border-b border-zinc-300 px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Painel Administrativo</p>
          <h1 className="text-xl font-semibold tracking-normal">Gestão de Estoque</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Acesso Autorizado
          </span>
          <button className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors" onClick={handleLogout}>
            Sair do Sistema
          </button>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[360px_1fr] items-start">
          <div className="sticky top-8 flex flex-col gap-6">
            <form className="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm" onSubmit={handleSubmit(onSubmitForm)}>
              <h2 className="mb-5 text-lg font-semibold border-b border-zinc-100 pb-3">
                {editingId ? "Editar Joia" : "Nova Joia"}
              </h2>

              <div className="grid gap-4">
                <label className="grid gap-1.5 text-sm font-medium">
                  Nome da peça
                  <input
                    {...register("name")}
                    className="rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                  />
                  {errors.name && <span className="text-xs text-red-500 font-semibold">{errors.name.message}</span>}
                </label>

                <label className="grid gap-1.5 text-sm font-medium">
                  Descrição detalhada
                  <textarea
                    {...register("description")}
                    className="min-h-[100px] rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors resize-y"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-medium min-w-0">
                    Preço (R$)
                    <input
                      type="number"
                      step="0.01"
                      {...register("price")}
                      className="w-full rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                    />
                    {errors.price && <span className="text-xs text-red-500 font-semibold">{errors.price.message}</span>}
                  </label>

                  <label className="grid gap-1.5 text-sm font-medium min-w-0">
                    Estoque
                    <input
                      type="number"
                      {...register("stock")}
                      className="w-full rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                    />
                    {errors.stock && <span className="text-xs text-red-500 font-semibold">{errors.stock.message}</span>}
                  </label>
                </div>

                <label className="grid gap-1.5 text-sm font-medium">
                  Categoria (ex: Anel, Colar)
                  <input
                    {...register("category")}
                    className="rounded border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                  />
                  {errors.category && <span className="text-xs text-red-500 font-semibold">{errors.category.message}</span>}
                </label>

                <div className="flex gap-3 pt-2">
                  <button className="flex-1 rounded bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400 transition-colors shadow-sm" disabled={loading} type="submit">
                    {loading ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar produto"}
                  </button>

                  {editingId && (
                    <button className="rounded border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors" type="button" onClick={() => { setEditingId(null); reset(); }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          <section className="rounded-lg border border-zinc-300 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-4">
              <h2 className="text-lg font-semibold text-zinc-800">Catálogo de Joias</h2>
              <button className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors shadow-sm" onClick={() => loadProducts(token)}>
                ↻ Atualizar
              </button>
            </div>

            <div className="grid divide-y divide-zinc-200">
              {products.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-zinc-500">O estoque está vazio. Cadastre a primeira joia ao lado.</p>
                </div>
              ) : (
                products.map((product) => (
                  <article className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_auto] hover:bg-zinc-50 transition-colors" key={product.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold text-zinc-900 text-lg">{product.name}</h3>
                        <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-800">{product.category}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-zinc-600 line-clamp-2">{product.description || "Nenhuma descrição fornecida."}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{formatCurrency(product.price)}</span>
                        <span className="text-zinc-500 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          Estoque: {product.stock} unidades
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <button className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors shadow-sm" onClick={() => handleEdit(product)}>
                        Editar
                      </button>
                      <button className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-sm" disabled={loading} onClick={() => handleDelete(product.id)}>
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