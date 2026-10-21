export const DISPLAY_NAME_MAX_LENGTH = 40;
// Legacy v1 presets are retained for saved profiles, not offered in the picker.
export const AVATAR_STYLES = [
  { id: "initials", label: "Initials" },
  { id: "leaf", label: "Leaf" },
  { id: "coffee", label: "Coffee" },
  { id: "book", label: "Book" },
] as const;
export const AVATAR_COLOURS = [
  { id: "sage", label: "Sage", background: "#eaf3e9", foreground: "#255d2f" },
  { id: "forest", label: "Forest", background: "#315b46", foreground: "#fafaf7" },
  { id: "cream", label: "Cream", background: "#f2ead7", foreground: "#71603d" },
  { id: "clay", label: "Clay", background: "#f1e1da", foreground: "#874f42" },
  { id: "slate", label: "Slate", background: "#e3e9ed", foreground: "#435e6b" },
] as const;
export type AvatarStyle = typeof AVATAR_STYLES[number]["id"];
export type AvatarColour = typeof AVATAR_COLOURS[number]["id"];
export type AvatarPreset = { style: AvatarStyle; colour: AvatarColour };

export const AVATAR_APPEARANCES = [
  { id: "soft", label: "Soft" },
  { id: "oval", label: "Oval" },
  { id: "defined", label: "Defined" },
] as const;
export const AVATAR_HAIRSTYLES = [
  { id: "crop", label: "Crop" },
  { id: "parted", label: "Parted" },
  { id: "waves", label: "Waves" },
  { id: "long", label: "Long" },
] as const;
export const AVATAR_SKIN_TONES = [
  { id: "light", label: "Light", base: "#efd1b9", shade: "#c99b7d", feature: "#815849" },
  { id: "sand", label: "Light medium", base: "#dbb08c", shade: "#b88765", feature: "#754c3a" },
  { id: "tan", label: "Medium", base: "#bc825d", shade: "#9d6647", feature: "#633f31" },
  { id: "brown", label: "Deep medium", base: "#925e43", shade: "#764831", feature: "#4c3027" },
  { id: "deep", label: "Deep", base: "#633f30", shade: "#503023", feature: "#34231e" },
] as const;
export const AVATAR_PRESENTATIONS = [
  { id: "boy", label: "Boy" },
  { id: "girl", label: "Girl" },
] as const;
export const AVATAR_HAIR_COLOURS = [
  { id: "brown", label: "Brown", fill: "#654637" },
  { id: "blonde", label: "Blonde", fill: "#bd965b" },
  { id: "ginger", label: "Ginger", fill: "#a85e3b" },
  { id: "black", label: "Black", fill: "#302d29" },
] as const;
export type PortraitAvatarConfig = {
  presentation: typeof AVATAR_PRESENTATIONS[number]["id"];
  hairColour: typeof AVATAR_HAIR_COLOURS[number]["id"];
  appearance: typeof AVATAR_APPEARANCES[number]["id"];
  hair: typeof AVATAR_HAIRSTYLES[number]["id"];
  skin: typeof AVATAR_SKIN_TONES[number]["id"];
  colour: AvatarColour;
};
export const DEFAULT_PORTRAIT: PortraitAvatarConfig = { presentation: "boy", hairColour: "black", appearance: "oval", hair: "parted", skin: "sand", colour: "sage" };
export const LEGACY_PORTRAIT_AVATAR_PREFIX = "https://hotseats.co.uk/avatars/presets/v2/";
export const PORTRAIT_AVATAR_PREFIX = "https://hotseats.co.uk/avatars/presets/v3/";
export function portraitAvatarSource(portrait: PortraitAvatarConfig): string {
  return `${PORTRAIT_AVATAR_PREFIX}${portrait.appearance}/${portrait.hair}/${portrait.skin}/${portrait.colour}/${portrait.presentation}/${portrait.hairColour}`;
}
export function parsePortraitAvatar(source: string | null | undefined): PortraitAvatarConfig | null {
  const legacy = source?.startsWith(LEGACY_PORTRAIT_AVATAR_PREFIX);
  if (!legacy && !source?.startsWith(PORTRAIT_AVATAR_PREFIX)) return null;
  const parts = source!.slice((legacy ? LEGACY_PORTRAIT_AVATAR_PREFIX : PORTRAIT_AVATAR_PREFIX).length).split("/");
  if (parts.length !== (legacy ? 4 : 6)) return null;
  const appearance = AVATAR_APPEARANCES.find(item => item.id === parts[0])?.id;
  const hair = AVATAR_HAIRSTYLES.find(item => item.id === parts[1])?.id;
  const skin = AVATAR_SKIN_TONES.find(item => item.id === parts[2])?.id;
  const colour = AVATAR_COLOURS.find(item => item.id === parts[3])?.id;
  // v2 retains its saved choices, with the original presentation and near-black hair.
  const presentation = legacy ? "boy" : AVATAR_PRESENTATIONS.find(item => item.id === parts[4])?.id;
  const hairColour = legacy ? "black" : AVATAR_HAIR_COLOURS.find(item => item.id === parts[5])?.id;
  return appearance && hair && skin && colour && presentation && hairColour ? { appearance, hair, skin, colour, presentation, hairColour } : null;
}

// URL-shaped identifiers satisfy the existing HTTPS database constraint. These
// are rendered locally, never fetched. Keep v1 stable; see docs/profile-editing.md.
export const AVATAR_PRESET_PREFIX = "https://hotseats.co.uk/avatars/presets/v1/";
export function avatarPresetSource(style: AvatarStyle, colour: AvatarColour): string | null {
  return style === "initials" && colour === "sage" ? null : `${AVATAR_PRESET_PREFIX}${style}/${colour}`;
}
export function parseAvatarPreset(source: string | null | undefined): AvatarPreset | null {
  if (source == null) return { style: "initials", colour: "sage" };
  for (const { id: style } of AVATAR_STYLES) {
    for (const { id: colour } of AVATAR_COLOURS) {
      if (source === `${AVATAR_PRESET_PREFIX}${style}/${colour}`) return { style, colour };
    }
  }
  return null;
}
export function profileInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "HS";
  return (words.length > 1
    ? `${Array.from(words[0])[0]}${Array.from(words[words.length - 1])[0]}`
    : Array.from(words[0]).slice(0, 2).join("")).toUpperCase();
}
export function normalizeDisplayName(name: string): string { return name.trim().replace(/\s+/g, " "); }
// undefined preserves the stored avatar; null restores the default initials.
export type ProfileEdits = { displayName: string; avatar?: string | null };
export type ProfileFieldErrors = Partial<Record<keyof ProfileEdits, string>>;
export function validateProfileEdits(edits: ProfileEdits): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  const name = normalizeDisplayName(edits.displayName);
  if (!name) errors.displayName = "Enter a display name.";
  else if (Array.from(name).length > DISPLAY_NAME_MAX_LENGTH) errors.displayName = "Use 40 characters or fewer.";
  if (edits.avatar !== undefined && !parseAvatarPreset(edits.avatar) && !parsePortraitAvatar(edits.avatar)) errors.avatar = "Choose one of the available avatar styles.";
  return errors;
}
