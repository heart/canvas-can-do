export const DEFAULT_FONT_FAMILY = 'Arial';

// Curated system-safe family names. UI can present these as enum choices.
export const FONT_FAMILY_OPTIONS = [
  'Arial',
  'Helvetica',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Courier New',
  'Lucida Console',
] as const;

export const FONT_WEIGHT_OPTIONS = [
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  'normal',
  'bold',
] as const;

export const FONT_STYLE_OPTIONS = ['normal', 'italic', 'oblique'] as const;

const FONT_FAMILY_SET = new Set<string>(FONT_FAMILY_OPTIONS);

export function normalizeFontFamily(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return DEFAULT_FONT_FAMILY;
  if (FONT_FAMILY_SET.has(raw)) return raw;
  return DEFAULT_FONT_FAMILY;
}

export function normalizeFontWeight(value: unknown): string {
  const raw = String(value ?? '').toLowerCase();
  if (raw === 'normal' || raw === 'bold') return raw;
  const num = Number.parseInt(raw, 10);
  if (Number.isFinite(num)) {
    const clamped = Math.max(100, Math.min(900, Math.round(num / 100) * 100));
    return String(clamped);
  }
  return 'normal';
}

export function normalizeFontStyle(value: unknown): 'normal' | 'italic' | 'oblique' {
  const raw = String(value ?? '').toLowerCase();
  if (raw === 'italic' || raw === 'oblique') return raw;
  return 'normal';
}
