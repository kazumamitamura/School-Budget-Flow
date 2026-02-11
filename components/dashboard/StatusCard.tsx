import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  type LucideIcon,
} from "lucide-react";

type StatusType = "pending" | "approved" | "warning" | "info";

interface StatusCardProps {
  type: StatusType;
  title: string;
  description: string;
  timestamp?: string;
}

const statusConfig: Record<
  StatusType,
  { icon: LucideIcon; bg: string; iconColor: string; border: string }
> = {
  pending: {
    icon: Clock,
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
    border: "border-amber-200",
  },
  approved: {
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    border: "border-emerald-200",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-red-50",
    iconColor: "text-red-500",
    border: "border-red-200",
  },
  info: {
    icon: FileText,
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    border: "border-blue-200",
  },
};

export default function StatusCard({
  type,
  title,
  description,
  timestamp,
}: StatusCardProps) {
  const config = statusConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border p-5 ${config.bg} ${config.border}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${config.iconColor}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
          {description}
        </p>
        {timestamp && (
          <p className="mt-2 text-xs text-gray-400">{timestamp}</p>
        )}
      </div>
    </div>
  );
}
