import { iconUrl } from '../lib/format';

export function Icon({ fam, alt, onClick }: { fam: string; alt?: string; onClick?: () => void }) {
  const img = <img src={iconUrl(fam)} alt={alt ?? fam} loading="lazy" className="h-9 w-9 shrink-0 rounded object-contain" />;
  if (!onClick) return img;
  return (
    <button
      onClick={onClick}
      title={alt ?? fam}
      aria-label={alt ?? fam}
      className="h-9 w-9 shrink-0 rounded border border-transparent p-0 transition hover:border-[var(--accent)] hover:bg-[var(--panel2)]"
    >
      {img}
    </button>
  );
}
