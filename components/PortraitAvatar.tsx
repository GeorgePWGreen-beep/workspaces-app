import { AVATAR_HAIR_COLOURS, AVATAR_SKIN_TONES, type PortraitAvatarConfig } from "@/utils/profile";

const faces = {
  soft: "M28 38C28 24 36 17 50 17S72 24 72 38L71 52C70 66 61 77 50 77S30 66 29 52Z",
  oval: "M30 38C30 24 37 17 50 17S70 24 70 38L69 53C68 66 59 79 50 79S32 66 31 53Z",
  defined: "M28 38C28 24 36 17 50 17S72 24 72 38L71 53L67 66L57 76Q50 80 43 76L33 66L29 53Z",
};
const haircuts = {
  crop: "M27 43L26 33C26 20 35 12 50 12S74 20 74 33L73 43L69 37L68 28Q50 25 32 28L31 37Z",
  parted: "M27 44L26 33C25 20 35 11 50 12C66 11 75 22 74 34L72 44L68 37L67 27C58 32 44 34 33 30L31 39Z",
  waves: "M27 44L25 34C24 24 30 18 37 16C44 10 53 11 60 15C69 16 76 24 75 34L73 44L68 38L66 30Q58 26 50 30Q42 33 34 30L31 39Z",
  long: "M25 49L25 34C24 20 35 11 50 12C67 11 76 23 75 37L77 91H67L68 40C68 32 65 26 60 24C52 30 43 34 32 33L33 91H23Z",
};
const girlHaircuts = {
  crop: "M27 44L26 33C26 20 35 12 50 12S74 20 74 33L73 44L69 38L67 28Q51 34 33 30L31 39Z",
  parted: "M26 49L25 33C25 20 35 11 50 12C66 11 75 22 75 35L73 49L68 42L67 27C58 33 45 36 33 32L32 43Z",
  waves: "M26 49L24 35C23 25 30 18 37 16C44 10 53 11 60 15C69 16 76 24 76 35L74 49L68 43L66 32Q58 28 50 32Q42 35 34 32L32 43Z",
  long: "M24 49L24 34C24 20 35 11 50 12C67 11 76 23 76 37L78 91H66L68 41C68 33 64 27 59 25C51 32 42 36 32 34L34 91H22Z",
};

/** Flat icon artwork: five shapes, or six for long hair. No shading or assets. */
export default function PortraitAvatar({ portrait }: { portrait: PortraitAvatarConfig }) {
  const skin = AVATAR_SKIN_TONES.find(tone => tone.id === portrait.skin) ?? AVATAR_SKIN_TONES[1];
  const hair = AVATAR_HAIR_COLOURS.find(colour => colour.id === portrait.hairColour)?.fill ?? "#302d29";
  const haircut = portrait.presentation === "girl" ? girlHaircuts : haircuts;
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className="h-full w-full" data-portrait="v3">
    {portrait.hair === "long" && <path d="M24 46V34C24 20 35 11 50 12C67 11 76 23 76 37L78 93H22Z" fill={hair} />}
    <path d="M3 104C6 90 22 85 40 82H60C78 85 94 90 97 104Z" fill="#65716b" />
    <path d={`M42 69H58L59 84Q50 89 41 84Z ${faces[portrait.appearance]}`} fill={skin.base} />
    <path d={haircut[portrait.hair]} fill={hair} />
    <path d="M39 47H40.5M59.5 47H61" fill="none" stroke={skin.feature} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M50 54V59H52" fill="none" stroke={skin.shade} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
