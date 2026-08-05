import { model } from "@/lib/gemini";

export async function generateWithGemini(prompt, previousCode = null, messages = [], theme = "dark background, light text, sleek modern feel", settings = {}, images = []) {

  // Build image instructions if user uploaded images
  const imageInstructions = images.length > 0 ? `
IMAGES TO USE:
The user has uploaded these images. Use them in the design wherever appropriate (hero backgrounds, product images, profile photos, gallery sections etc):
${images.map((url, i) => `Image ${i + 1}: ${url}`).join("\n")}
` : "";

  // Follow-up prompt — refine existing code
  const followUpPrompt = `You are an elite UI engineer. The user has an existing app and wants to modify it.

Here is the current HTML code:
${previousCode}

The user wants to make this change: "${prompt}"

RULES:
- Return the COMPLETE updated HTML file with the change applied
- Keep everything else exactly the same
- Make the change cleanly and precisely
- Return ONLY raw HTML. No explanation. No markdown. No backticks.`;

  // Base prompt — generate new app from scratch
  const basePrompt = `You are the world's most talented UI engineer, creative director, and full-stack developer combined. You have worked at Apple, Stripe, Linear, Vercel, and Figma. Your designs are featured in design awards globally.

When a user describes an app, you don't just build it — you REIMAGINE it. You think about:
- What would make someone say "WOW" when they first see this?
- What unexpected design choice would make this unforgettable?
- How can I make this feel like a $10 million product?

VISUAL EXCELLENCE — MANDATORY:
- Use stunning hero sections with layered depth (multiple gradients, floating elements, blur effects)
- Every section must have visual interest — no flat boring layouts
- Use glassmorphism cards with backdrop-filter: blur(20px) and subtle borders
- Add floating decorative elements (blurred gradient orbs, geometric shapes, dot grids)
- Use mesh gradients for backgrounds — not flat colors
- Typography must be BOLD and expressive — mix large display text with fine details
- Add micro-interactions on every interactive element
- Use CSS animations: fadeIn, slideUp, float, pulse, shimmer effects
- Cards must have depth — box shadows, inner glows, border gradients
- Use CSS clip-path for creative section dividers
- Color usage must be intentional — pick a palette of 3-4 colors and use them consistently

TECHNICAL EXCELLENCE — MANDATORY:
- Single HTML file
- Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts — pick the PERFECT font for the vibe (import via @import in style tag)
- Font Awesome icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
- Write custom CSS in a <style> tag for everything Tailwind can't do:
  * Mesh gradient backgrounds
  * Glassmorphism effects
  * Custom animations (@keyframes)
  * Gradient text
  * Glowing borders
  * Particle or floating orb effects using CSS
  * Custom scrollbar
- Add JavaScript for:
  * Scroll animations (elements fade in as you scroll)
  * Smooth counter animations for stats
  * Interactive tabs, accordions, or modals where relevant
  * Cursor glow effect (subtle light that follows the mouse)
  * Typing animation for hero headlines

STRUCTURE — MANDATORY for landing pages:
1. Navigation — glassmorphism, sticky, with logo + links + CTA button
2. Hero — MASSIVE, full viewport height, with animated headline, subtext, dual CTAs, hero visual/mockup
3. Social proof bar — logos or "trusted by X users" with animation
4. Features — 3-6 cards with icons, each with hover animations
5. How it works — numbered steps with connecting lines
6. Testimonials — quote cards with avatars, ratings
7. Pricing — 3 tiers, middle one highlighted with gradient
8. FAQ — accordion with smooth open/close
9. Final CTA — bold, full-width, gradient background
10. Footer — links, social icons, copyright

CONTENT — MANDATORY:
- Write REAL, specific, compelling copy — not placeholder text
- Headlines must be bold and emotional — not generic
- Use real-looking data, stats, testimonials
- Company/product names must feel authentic and premium

THEME: ${theme}

STYLE SETTINGS:
- Font: ${settings.font || "Inter"} — import from Google Fonts
- Corner style: ${settings.borderRadius || "rounded"} corners on all elements
- Layout density: ${settings.density || "comfortable"} spacing
- Icons: use ${settings.iconStyle || "emoji"} icons
- Animations: ${settings.animationLevel || "moderate"} level of animations

${imageInstructions}

Return ONLY raw HTML. No explanation. No markdown. No backticks.

User request: ${prompt}`;

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{ text: previousCode ? followUpPrompt : basePrompt }]
    }],
  });

  return result.response.text();
}