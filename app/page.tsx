import { redirect } from "next/navigation";

// Raiz: leva à vitrine (o app é livre para navegar; o login só é exigido
// ao finalizar uma compra e nas telas pessoais).
export default function Index() {
  redirect("/home");
}
