"use client";

import { AuthModal } from "easy-auth-react";
import { useRouter } from "next/navigation";

// Since it's an interactive login, we can store auth in cookies to please middleware
export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center p-24 bg-zinc-50 dark:bg-zinc-950">
      <AuthModal
        apiBaseUrl="http://localhost:3000/api/auth"
        onClose={() => console.log("Closed modal")}
        onSuccess={async (token, user, isNewUser) => {
          // Typically we set an httpOnly cookie. For this client example, 
          // we call a Next Server Action or Route Handler to set the cookie securely.
          await fetch('/api/auth/session', {
            method: 'POST',
            body: JSON.stringify({ token }),
          });
          router.push("/dashboard");
        }}
      />
    </main>
  );
}
