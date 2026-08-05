"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Landing() {
  const router = useRouter();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const features = [
    { icon: "⚡", title: "Lightning fast", desc: "Generate complete web apps in seconds. Just describe what you want and watch it come to life.", gradient: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/20" },
    { icon: "💬", title: "Chat to refine", desc: "Not happy with something? Tell Pero what to change and it updates instantly.", gradient: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/20" },
    { icon: "📱", title: "Mobile preview", desc: "See exactly how your app looks on desktop and mobile before downloading.", gradient: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/20" },
    { icon: "💾", title: "Save projects", desc: "All your generated apps are saved to your account. Access them anytime.", gradient: "from-green-500/20 to-teal-500/20", border: "border-green-500/20" },
    { icon: "📥", title: "Download code", desc: "Own your code completely. Download clean HTML files you can host anywhere.", gradient: "from-red-500/20 to-rose-500/20", border: "border-red-500/20" },
    { icon: "🎨", title: "Pro designs", desc: "Every app is crafted to Apple and Stripe quality standards automatically.", gradient: "from-indigo-500/20 to-violet-500/20", border: "border-indigo-500/20" },
  ];

  const testimonials = [
    { name: "Sarah K.", role: "Agency Owner", text: "Pero saved us 40+ hours a week. We now deliver client prototypes in minutes.", avatar: "SK" },
    { name: "James T.", role: "Student", text: "I built my entire portfolio in one afternoon. The designs look incredibly professional.", avatar: "JT" },
    { name: "Maria L.", role: "Entrepreneur", text: "I had zero coding experience. Pero helped me launch my startup landing page in an hour.", avatar: "ML" },
  ];

  return (
    <main className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">P</div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Pero</h1>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition">Features</button>
          <button onClick={() => document.getElementById('testimonials').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition">Testimonials</button>
          <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition">Pricing</button>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/login")} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">Sign in</button>
          <button onClick={() => router.push("/login")} className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold transition shadow-lg shadow-blue-500/25">
            Get started free
          </button>
        </div>
      </nav>

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 gap-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          AI-powered app builder for everyone
        </div>

        <h2 className="text-6xl md:text-8xl font-black leading-none tracking-tight max-w-5xl">
          <span className="block text-white">Build stunning</span>
          <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            web apps
          </span>
          <span className="block text-white">in seconds</span>
        </h2>

        <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
          Describe your idea in plain English. Pero's AI transforms it into a beautiful, production-ready web app — no coding required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button onClick={() => router.push("/login")}
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg transition shadow-2xl shadow-blue-500/30 flex items-center gap-2">
            Start building for free
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <button onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-lg transition backdrop-blur-sm">
            See it in action
          </button>
        </div>

        <div className="flex items-center gap-8 mt-8 text-sm text-gray-500">
          <span>✓ Free to start</span>
          <span>✓ No credit card</span>
          <span>✓ No coding needed</span>
        </div>
      </section>

      <section id="demo" className="relative z-10 px-8 py-12 flex justify-center">
        <div className="w-full max-w-5xl">
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm bg-white/5">
            <div className="bg-black/40 px-4 py-3 flex items-center gap-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="flex-1 bg-white/10 rounded-md px-3 py-1 text-xs text-gray-400 text-center">pero.app/builder</div>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Your prompt</div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300 text-sm leading-relaxed">
                  "Build me a SaaS landing page for an AI writing tool with a dark theme, pricing section and testimonials"
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce delay-200"></div>
                  </div>
                  <span className="text-gray-400">Pero is generating...</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["🎨 Glassmorphism UI", "📱 Mobile ready", "⚡ Animations", "🌈 Custom colors"].map((f) => (
                    <div key={f} className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-gray-400 text-center">{f}</div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-white/10 p-4 flex flex-col gap-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Live preview</div>
                <div className="flex-1 bg-black/30 rounded-lg p-3 flex flex-col gap-2">
                  <div className="h-3 bg-gradient-to-r from-blue-500/40 to-purple-500/40 rounded w-3/4"></div>
                  <div className="h-2 bg-white/10 rounded w-1/2"></div>
                  <div className="h-2 bg-white/10 rounded w-2/3"></div>
                  <div className="h-8 bg-gradient-to-r from-blue-600/60 to-purple-600/60 rounded-lg w-1/3 mt-2"></div>
                  <div className="grid grid-cols-3 gap-1 mt-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 bg-white/5 border border-white/10 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 px-8 py-24 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-medium mb-4">Features</div>
          <h3 className="text-4xl md:text-5xl font-bold">Everything you need</h3>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">Pero packs everything a non-coder, agency, or student needs to build and ship beautiful web apps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className={`bg-gradient-to-br ${f.gradient} border ${f.border} rounded-2xl p-6 flex flex-col gap-3 hover:scale-105 transition-transform duration-300 backdrop-blur-sm`}>
              <span className="text-3xl">{f.icon}</span>
              <h4 className="font-bold text-lg">{f.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="relative z-10 px-8 py-24 bg-white/2">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium mb-4">Testimonials</div>
            <h3 className="text-4xl md:text-5xl font-bold">Loved by builders</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/8 transition backdrop-blur-sm">
                <div className="flex text-yellow-400 text-sm">{"★★★★★"}</div>
                <p className="text-gray-300 text-sm leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative z-10 px-8 py-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-4">Pricing</div>
          <h3 className="text-4xl md:text-5xl font-bold">Simple pricing</h3>
          <p className="text-gray-400 mt-4">Start free. Upgrade when you're ready.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Free", price: "$0", desc: "Perfect for getting started", features: ["5 projects", "Basic generation", "Download HTML", "Community support"], cta: "Get started", highlight: false },
            { name: "Pro", price: "$12", desc: "For serious builders", features: ["Unlimited projects", "Advanced AI prompts", "Priority generation", "Chat refinement", "Email support"], cta: "Start Pro", highlight: true },
            { name: "Agency", price: "$29", desc: "For teams and agencies", features: ["Everything in Pro", "White label", "Client sharing", "Custom domain", "Priority support"], cta: "Start Agency", highlight: false },
          ].map((p) => (
            <div key={p.name} className={`rounded-2xl p-6 flex flex-col gap-4 ${
              p.highlight
                ? "bg-gradient-to-b from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 scale-105"
                : "bg-white/5 border border-white/10"
            }`}>
              {p.highlight && <div className="text-center text-xs font-bold text-blue-400 bg-blue-500/20 rounded-full py-1">Most Popular</div>}
              <div>
                <h4 className="font-bold text-lg">{p.name}</h4>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black">{p.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{p.desc}</p>
              </div>
              <ul className="flex flex-col gap-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push("/login")}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  p.highlight
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/25"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-8 py-24 flex flex-col items-center text-center gap-6">
        <h3 className="text-5xl md:text-6xl font-black max-w-2xl leading-tight">
          Ready to build something
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> amazing?</span>
        </h3>
        <p className="text-gray-400 max-w-md text-lg">Join thousands of non-coders, agencies and students building with Pero.</p>
        <button
          onClick={() => router.push("/login")}
          className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-xl transition shadow-2xl shadow-blue-500/30 flex items-center gap-3"
        >
          Start building for free
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
        <p className="text-gray-600 text-sm">No credit card required · Free forever plan</p>
      </section>

      <footer className="relative z-10 px-8 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">P</div>
          <span>Pero — AI App Builder</span>
        </div>
        <span>© 2026 Pero. All rights reserved.</span>
      </footer>
    </main>
  );
}