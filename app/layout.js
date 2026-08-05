import "./globals.css";

export const metadata = {
  title: "Pero — AI App Builder",
  description: "Build stunning web apps with AI in seconds",
  manifest: "/manifest.json",
  themeColor: "#030712",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pero",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#030712" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pero" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}