import { redirect } from "next/navigation";

// Raiz: leva ao login do cliente.
export default function Index() {
  redirect("/login");
}
