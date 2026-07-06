import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  action?: { href: string; label: string };
};

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-zinc-700">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="dash-btn-brand-lg transition"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function BackLink({ href, children = "← Volver" }: { href: string; children?: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center text-sm font-medium text-zinc-700 hover:text-zinc-900"
    >
      {children}
    </Link>
  );
}
