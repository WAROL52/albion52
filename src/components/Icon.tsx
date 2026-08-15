import { iconUrl } from '../lib/format';

export function Icon({ fam, alt, onClick }: { fam: string; alt?: string; onClick?: () => void }) {
  const img = (
    <img
      src={iconUrl(fam)}
      alt={alt ?? fam}
      loading="lazy"
      className="h-11 w-11 shrink-0 rounded object-contain transition duration-150 group-hover:scale-105 sm:h-9 sm:w-9"
    />
  );
  if (!onClick) {
    return (
      <span className="group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded hover:bg-[var(--panel2)] sm:h-9 sm:w-9">
        {img}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      title={alt ?? fam}
      aria-label={alt ?? fam}
      className="group inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent transition duration-150 hover:border-[var(--accent)] hover:bg-[var(--panel2)] active:scale-90 sm:h-9 sm:w-9"
    >
      {img}
    </button>
  );
}
