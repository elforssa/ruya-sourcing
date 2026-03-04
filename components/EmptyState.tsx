import React from "react";
import Link from "next/link";

type Props = {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {Icon && (
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
