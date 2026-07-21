import DynamicIcon from "@/components/ui/DynamicIcon";
import Button from "@/components/ui/Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon = "receipt", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
        <DynamicIcon name={icon} size="xl" className="text-primary/60" />
      </div>
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {description && (
        <p className="text-xs text-text-secondary mt-1 max-w-[240px]">{description}</p>
      )}
      {action && (
        <Button size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
