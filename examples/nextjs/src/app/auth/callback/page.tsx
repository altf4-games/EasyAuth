"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      if (token) {
        // Set the secure cookie via the internal API route
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    };
    handleCallback();
  }, [router, searchParams]);

  return <div className="text-zinc-500">Completing sign in...</div>;
}

export default function AuthCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
