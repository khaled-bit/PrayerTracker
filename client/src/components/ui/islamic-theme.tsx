import { cn } from "@/lib/utils";

export interface IslamicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "outlined";
}

export function IslamicCard({ 
  className, 
  variant = "default", 
  children, 
  ...props 
}: IslamicCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl shadow-lg transition-all duration-300",
        {
          "bg-white border border-gray-200": variant === "default",
          "bg-gradient-to-br from-islamic-green to-islamic-sage text-white": variant === "gradient",
          "bg-white border-2 border-islamic-green": variant === "outlined",
        },
        "hover:shadow-xl hover:scale-[1.02]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PrayerStatusIndicatorProps {
  status: "completed" | "pending" | "missed" | "late";
  size?: "sm" | "md" | "lg";
}

export function PrayerStatusIndicator({ 
  status, 
  size = "md" 
}: PrayerStatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-6 h-6",
  };

  const statusClasses = {
    completed: "bg-islamic-green",
    pending: "bg-gray-400",
    missed: "bg-red-500",
    late: "bg-islamic-gold",
  };

  return (
    <div 
      className={cn(
        "rounded-full",
        sizeClasses[size],
        statusClasses[status]
      )}
    />
  );
}

export interface GeometricPatternProps extends React.HTMLAttributes<HTMLDivElement> {
  pattern?: "border" | "background";
}

export function GeometricPattern({ 
  className, 
  pattern = "border", 
  children,
  ...props 
}: GeometricPatternProps) {
  return (
    <div
      className={cn(
        {
          "border-2 border-transparent bg-gradient-to-r from-islamic-green to-islamic-gold bg-clip-border": pattern === "border",
          "bg-gradient-to-br from-islamic-green/5 to-islamic-gold/5": pattern === "background",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
