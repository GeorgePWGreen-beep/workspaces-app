"use client";

import { useState } from "react";
import { BookOpen, Coffee, Leaf } from "lucide-react";
import { AVATAR_COLOURS, parseAvatarPreset, parsePortraitAvatar, profileInitials } from "@/utils/profile";
import PortraitAvatar from "./PortraitAvatar";

const sizes = { small: "h-9 w-9 text-sm", medium: "h-11 w-11 text-base", preview: "h-16 w-16 text-[24px]", large: "h-20 w-20 text-[28px]" };

/** Decorative: the adjacent profile name or picker label supplies the accessible name. */
export default function ProfileAvatar({ name, source, size = "medium", className = "" }: {
  name: string; source?: string | null; size?: keyof typeof sizes; className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const preset = parseAvatarPreset(source);
  const portrait = parsePortraitAvatar(source);
  const colour = AVATAR_COLOURS.find(item => item.id === (portrait?.colour ?? preset?.colour)) ?? AVATAR_COLOURS[0];
  const Icon = preset?.style === "leaf" ? Leaf : preset?.style === "coffee" ? Coffee : preset?.style === "book" ? BookOpen : null;
  // Existing HTTPS photos remain supported. Unrecognised preset versions fall
  // back to initials, rather than issuing a request for an opaque identifier.
  const photo = !preset && typeof source === "string" && source.startsWith("https://") && !source.startsWith("https://hotseats.co.uk/avatars/presets/") && source !== failedSource ? source : null;
  return <span aria-hidden="true" className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full align-middle font-semibold tracking-[-0.04em] ${sizes[size]} ${className}`} style={{ backgroundColor: colour.background, color: colour.foreground }}>
    {photo
      // Existing public profile photos are arbitrary HTTPS URLs; do not send a referrer.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={photo} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailedSource(photo)} />
      : portrait ? <PortraitAvatar portrait={portrait} /> : Icon ? <Icon className="h-[52%] w-[52%]" strokeWidth={1.6} /> : profileInitials(name)}
  </span>;
}
