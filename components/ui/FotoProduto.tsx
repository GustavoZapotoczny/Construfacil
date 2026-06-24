import { clsx } from "@/lib/cx";

/** Renderiza a foto do produto: emoji (mock) ou imagem (URL/data URL). */
export function FotoProduto({
  foto,
  alt,
  className,
  emojiClassName,
}: {
  foto: string;
  alt: string;
  className?: string;
  emojiClassName?: string;
}) {
  const ehImagem = /^(https?:|data:|\/)/.test(foto);
  if (ehImagem) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={foto}
        alt={alt}
        className={clsx("h-full w-full rounded-[inherit] object-cover", className)}
      />
    );
  }
  return <span className={emojiClassName}>{foto}</span>;
}
