import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  label?: string;
  variant?: "ghost" | "default" | "outline";
  className?: string;
}

export function BackButton({ 
  href = "/", 
  label = "Back to Practice",
  variant = "ghost",
  className = "text-gray-600 hover:text-gray-900"
}: BackButtonProps) {
  return (
    <Link href={href}>
      <Button variant={variant} size="sm" className={className} data-testid="button-back">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </Link>
  );
}
