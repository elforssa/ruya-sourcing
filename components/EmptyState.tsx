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
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted animate-float">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="btn-press mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
