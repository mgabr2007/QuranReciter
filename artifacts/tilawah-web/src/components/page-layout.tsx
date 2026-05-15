import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: "4xl" | "6xl" | "7xl";
  background?: "default" | "gradient";
}

export function PageLayout({ 
  children, 
  maxWidth = "4xl",
  background = "default" 
}: PageLayoutProps) {
  const bgClass = background === "gradient" 
    ? "bg-gradient-to-br from-islamic-light via-white to-islamic-light/30"
    : "bg-[hsl(var(--surface))]";
    
  const containerClass = maxWidth === "6xl" 
    ? "max-w-6xl" 
    : maxWidth === "7xl" 
    ? "max-w-7xl" 
    : "max-w-4xl";

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <main className={`${containerClass} mx-auto px-4 py-6`}>
        {children}
      </main>
    </div>
  );
}
