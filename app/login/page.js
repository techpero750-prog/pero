"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleAuth() {
    setLoading(true);
    setMessage("");

   if (isSignUp) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) setMessage(error.message);
  else {
    // Save referral code if present
    if (refCode && data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        referred_by: refCode,
        plan: "free",
        coins: 70, // 50 base + 20 welcome bonus
      });

      // Credit the referrer
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id, coins, referral_count")
        .eq("referral_code", refCode)
        .single();

      if (referrer) {
        const coinsPerReferral = { free: 25, starter: 50, pro: 100, premium: 200, business: 500, lifetime: 1000 }[referrer.plan || "free"];
        await supabase.from("profiles").update({
          coins: (referrer.coins || 0) + coinsPerReferral,
          referral_count: (referrer.referral_count || 0) + 1,
        }).eq("id", referrer.id);
      }
    }
    setMessage("Check your email to confirm your account!");
  }
}
  }

const [refCode, setRefCode] = useState("");

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) setRefCode(ref);
}, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-10">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center">
          {isSignUp ? "Create account" : "Welcome back"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 focus:outline-none focus:border-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 focus:outline-none focus:border-blue-500"
        />

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-xl font-semibold transition"
        >
          {loading ? "Loading..." : isSignUp ? "Sign up" : "Sign in"}
        </button>

        {message && (
          <p className="text-center text-sm text-yellow-400">{message}</p>
        )}

        <p className="text-center text-sm text-gray-400">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </main>
  );
}