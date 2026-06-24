import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-4xl">
        🧱
      </div>
      <h1 className="text-lg font-bold text-stone-800">Página não encontrada</h1>
      <p className="mt-1 text-sm text-stone-500">
        Essa página pode ter sido movida ou não existe mais.
      </p>
      <Link
        href="/home"
        className="mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition active:scale-[0.99]"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
