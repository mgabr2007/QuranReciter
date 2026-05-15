import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "info";
}

export function StatCard({ value, label, icon, variant = "default" }: StatCardProps) {
  const colorClass = variant === "success" 
    ? "text-islamic-green" 
    : variant === "info" 
    ? "text-blue-600" 
    : "text-islamic-green";

  return (
    <Card>
      <CardContent className="p-4 text-center">
        {icon && (
          <div className="flex justify-center mb-2">
            {icon}
          </div>
        )}
        <div className={`text-2xl font-bold ${colorClass}`}>
          {value}
        </div>
        <div className="text-sm text-gray-600">{label}</div>
      </CardContent>
    </Card>
  );
}
