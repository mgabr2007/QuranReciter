import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href}>
                <span className="hover:text-foreground transition-colors cursor-pointer" data-testid={`breadcrumb-${item.label.toLowerCase()}`}>
                  {item.label}
                </span>
              </Link>
            ) : (
              <span className={cn(isLast && "text-foreground font-medium")} data-testid={`breadcrumb-${item.label.toLowerCase()}`}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </div>
        );
      })}
    </nav>
  );
}
