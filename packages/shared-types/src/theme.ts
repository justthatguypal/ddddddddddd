import { z } from 'zod';

/**
 * Theme token contract. Every color the launcher paints comes from one of these.
 * Values are stored as #RRGGBB hex; the theme engine converts them to `R G B` triplets
 * on :root so Tailwind opacity modifiers keep working.
 */
export const THEME_COLOR_TOKENS = [
  'bg-base',
  'bg-rail',
  'bg-topbar',
  'bg-panel',
  'bg-elevated',
  'bg-hover',
  'bg-input',
  'border',
  'border-strong',
  'text-primary',
  'text-secondary',
  'text-muted',
  'accent',
  'accent-hover',
  'accent-contrast',
  'meteor-from',
  'meteor-via',
  'meteor-to',
  'success',
  'warning',
  'danger',
  'info',
  'focus',
  'vbucks',
  'hero-sky-top',
  'hero-sky-bottom',
] as const;
export const ThemeColorToken = z.enum(THEME_COLOR_TOKENS);
export type ThemeColorToken = z.infer<typeof ThemeColorToken>;

export const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected #RRGGBB');

export const ThemeColors = z.object(
  Object.fromEntries(THEME_COLOR_TOKENS.map((t) => [t, HexColor])) as Record<
    ThemeColorToken,
    typeof HexColor
  >,
);
export type ThemeColors = z.infer<typeof ThemeColors>;

export const DISPLAY_FONTS = ['Bungee', 'Titan One'] as const;

export const ThemeDefinition = z.object({
  /** Schema version of the exported theme file. */
  $schema: z.literal('ogfn-theme/1').default('ogfn-theme/1'),
  id: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().min(1).max(40),
  author: z.string().max(40).default('Unknown'),
  colors: ThemeColors,
  radius: z.number().min(0).max(12),
  displayFont: z.enum(DISPLAY_FONTS),
});
export type ThemeDefinition = z.infer<typeof ThemeDefinition>;

export const PRESET_THEME_IDS = ['season-3', 'midnight', 'snowfall', 'cobalt', 'high-contrast'] as const;
export type PresetThemeId = (typeof PRESET_THEME_IDS)[number];
