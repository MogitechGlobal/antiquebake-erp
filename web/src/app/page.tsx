// web/src/app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  // Automatically redirect anyone visiting the root domain to the login page
  redirect("/login");
}