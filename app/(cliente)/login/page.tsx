"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { entrar, entrarComGoogle, authDisponivel } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const r = await entrar(email, senha);
    setCarregando(false);
    if (!r.ok) {
      setErro(r.erro ?? "Não foi possível entrar.");
      return;
    }
    router.push(r.tipo === "lojista" ? "/lojista" : "/home");
  }

  async function loginGoogle() {
    setErro("");
    setCarregando(true);
    const r = await entrarComGoogle();
    if (!r.ok) {
      setCarregando(false);
      setErro(r.erro ?? "Não foi possível entrar com o Google.");
      return;
    }
    // Com Supabase, o navegador é redirecionado ao Google → /auth/callback.
    // Em modo mock, a sessão já está pronta:
    if (!authDisponivel) router.push("/home");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Topo laranja com a marca */}
      <div className="bg-gradient-to-b from-orange-500 to-orange-600 px-6 pb-10 pt-16 text-center text-white">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 text-5xl backdrop-blur">
          🏗️
        </div>
        <h1 className="text-2xl font-bold">Construfácil</h1>
        <p className="mt-1 text-sm text-orange-50">
          Materiais de construção na sua obra
        </p>
      </div>

      {/* Formulário */}
      <form
        onSubmit={fazerLogin}
        className="flex flex-1 flex-col gap-4 px-6 pt-8"
      >
        <Campo
          label="E-mail ou celular"
          type="text"
          inputMode="email"
          placeholder="voce@email.com"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconeEsquerda={<Mail size={18} />}
        />
        <Campo
          label="Senha"
          type={mostrarSenha ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          iconeEsquerda={<Lock size={18} />}
          acaoDireita={
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="text-stone-400"
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="text-right">
          <button type="button" className="text-sm text-orange-600">
            Esqueci minha senha
          </button>
        </div>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {erro}
          </p>
        )}

        <Botao type="submit" bloco disabled={carregando}>
          {carregando ? "Entrando…" : "Entrar"}
        </Botao>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-400">ou</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <Botao
          type="button"
          variante="secundario"
          bloco
          onClick={loginGoogle}
          disabled={carregando}
        >
          <span className="text-base">G</span> Continuar com Google
        </Botao>

        {!authDisponivel && (
          <p className="text-center text-xs text-stone-400">
            Modo demonstração — qualquer e-mail/senha entra. Configure o
            Supabase em <code>.env.local</code> para autenticação real.
          </p>
        )}

        <p className="mt-auto pb-8 pt-4 text-center text-sm text-stone-500">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-orange-600">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
