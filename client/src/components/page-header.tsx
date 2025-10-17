import { ReactNode } from "react";

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  leftContent?: ReactNode;
  maxWidth?: "4xl" | "6xl" | "7xl";
}

export function PageHeader({ 
  icon, 
  title, 
  subtitle, 
  actions,
  leftContent,
  maxWidth = "4xl"
}: PageHeaderProps) {
  const containerClass = maxWidth === "6xl" 
    ? "max-w-6xl" 
    : maxWidth === "7xl" 
    ? "max-w-7xl" 
    : "max-w-4xl";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className={`${containerClass} mx-auto px-4 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {leftContent}
            
            {icon && (
              <div className="w-10 h-10 bg-islamic-green rounded-lg flex items-center justify-center">
                {icon}
              </div>
            )}
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
