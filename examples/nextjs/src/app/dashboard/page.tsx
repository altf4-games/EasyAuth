import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const c = await cookies();
  const token = c.get("auth-token")?.value;

  if (!token) redirect("/");

  let user;
  try {
    const res = await fetch("http://localhost:3000/api/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Invalid token");
    const data = await res.json();
    user = data.user;
  } catch (err) {
    // Token tampered or expired
    redirect("/");
  }

  async function logout() {
    "use server";
    const c = await cookies();
    c.delete("auth-token");
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 relative overflow-hidden">
        {/* Subtle decorative background blur */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Authentication successful</p>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
              <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Account Email
              </span>
              <span className="block font-medium text-lg">{user.email}</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
              <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Member Since
              </span>
              <span className="block font-medium">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <form action={logout}>
            <button 
              type="submit" 
              className="w-full py-3 px-4 flex justify-center items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-red-200 dark:hover:border-red-900/50 text-red-600 dark:text-red-400 font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Securely Log Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
