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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h1>
      <p className="mb-2">Logged in as: {user.email}</p>
      <p className="mb-2 text-sm text-gray-500">Account created: {new Date(user.createdAt).toLocaleString()}</p>
      
      <form action="/api/auth/session" method="POST" className="mt-8">
        <button type="submit" formMethod="POST" className="text-red-500 underline" formAction="/api/auth/session" name="_method" value="DELETE">
           Log out
        </button>
      </form>
    </div>
  );
}
