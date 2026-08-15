import { iconUrl } from '../lib/format';

export function Icon({ fam, alt }: { fam: string; alt?: string }) {
  return <img src={iconUrl(fam)} alt={alt ?? fam} loading="lazy" className="h-9 w-9 shrink-0 rounded object-contain" />;
}
