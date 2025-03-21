"use client";
import { DebtTracker } from "@/components/debt-tracker";
import { ThemeProvider } from "@/components/theme-provider";

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="min-h-screen p-4 md:p-8">
        <DebtTracker />
      </main>
    </ThemeProvider>
  );
}
