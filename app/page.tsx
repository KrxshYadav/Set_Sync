import { redirect } from "next/navigation";

// Root: bounce into the app. Middleware sends signed-out users to /login.
export default function RootPage() {
  redirect("/home");
}
