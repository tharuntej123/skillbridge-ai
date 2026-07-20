import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "SkillBridge AI - Freelance Matchmaking & Learning Platform",
  description: "Discover suitable jobs using AI-powered skill matching and generate personalized learning roadmaps using Google Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Decorative ambient background glows */}
        <div className="absolute top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[150px]" />
        
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
        <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-muted-foreground bg-slate-950">
          <p>© {new Date().getFullYear()} SkillBridge AI. Powered by Sentence-BERT & Google Gemini.</p>
        </footer>
      </body>
    </html>
  );
}
