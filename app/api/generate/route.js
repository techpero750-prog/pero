import { NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/generate";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";

const COIN_COSTS = { simple: 10, medium: 25, advanced: 50, heavy: 100 };
const DAILY_LIMITS = { free: 5, starter: 200, pro: Infinity, premium: Infinity, business: Infinity, lifetime: Infinity };
const COINS_PER_APP = { free: 1, starter: 2, pro: 5, premium: 10, business: 20, lifetime: 50 };
const DISCOUNTS = { free: 0, starter: 0.05, pro: 0.10, premium: 0.20, business: 0.30, lifetime: 0.40 };

export async function POST(req) {
  try {
    const supabase = createAdminClient();
    const { prompt, previousCode, messages, theme, settings, images } = await req.json();

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      // Debug log
      console.log("Auth user:", user?.id, "Auth error:", authError?.message);

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        // Debug log
        console.log("Profile:", profile?.plan, "Coins:", profile?.coins, "Profile error:", profileError?.message);

        const plan = profile?.plan || "free";
        const currentCoins = profile?.coins ?? 0;

        let coinCost = COIN_COSTS.simple;
        if (prompt.length > 200) coinCost = COIN_COSTS.heavy;
        else if (prompt.length > 100) coinCost = COIN_COSTS.advanced;
        else if (prompt.length > 50) coinCost = COIN_COSTS.medium;
        coinCost = Math.floor(coinCost * (1 - (DISCOUNTS[plan] || 0)));

        console.log("Coin cost:", coinCost, "Current coins:", currentCoins, "Plan:", plan);

        if (currentCoins < coinCost) {
          return NextResponse.json({
            error: "INSUFFICIENT_COINS",
            message: `You need ${coinCost} coins but only have ${currentCoins}. Plan: ${plan}`,
            coinsNeeded: coinCost,
            coinsAvailable: currentCoins,
          }, { status: 402 });
        }

        const dailyLimit = DAILY_LIMITS[plan];
        if (dailyLimit !== Infinity) {
          const today = new Date().toISOString().split("T")[0];
          const { data: usage } = await supabase.from("usage").select("generations").eq("user_id", user.id).eq("date", today).single();
          const currentGenerations = usage?.generations || 0;
          if (currentGenerations >= dailyLimit) {
            return NextResponse.json({ error: "LIMIT_REACHED", message: `Daily limit reached` }, { status: 429 });
          }
          await supabase.from("usage").upsert({ user_id: user.id, date: today, generations: currentGenerations + 1 }, { onConflict: "user_id,date" });
        }

        const coinsEarned = COINS_PER_APP[plan] || 1;
        const newCoins = currentCoins - coinCost + coinsEarned;
        await supabase.from("profiles").upsert({ id: user.id, coins: Math.max(0, newCoins) });
        await supabase.from("coin_transactions").insert({ user_id: user.id, amount: -coinCost, type: "spent", description: `Generated: ${prompt.slice(0, 50)}` });
        await supabase.from("coin_transactions").insert({ user_id: user.id, amount: coinsEarned, type: "earned", description: "Build-to-Earn reward" });
      }
    }

    const output = await generateWithGemini(prompt, previousCode, messages, theme, settings, images);
    return NextResponse.json({ result: output });

  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}