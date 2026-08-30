"use client";

import { motion } from "framer-motion";
import { Bookmark, MapPin, UsersRound, type LucideIcon } from "lucide-react";

export type DockSheetMode = "nearby" | "saved" | "friends";

interface DockItem {
  label: string;
  mode: DockSheetMode;
  icon: LucideIcon;
  primary?: boolean;
}

const dockItems: DockItem[] = [
  { label: "Nearby", mode: "nearby", icon: MapPin, primary: true },
  { label: "Saved", mode: "saved", icon: Bookmark },
  { label: "Friends", mode: "friends", icon: UsersRound },
];

export default function FloatingDock({
  onSelect,
}: {
  onSelect: (mode: DockSheetMode) => void;
}) {
  return (
    <motion.nav
      aria-label="Map navigation"
      className="hs-floating-dock fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 z-30 flex h-[68px] w-[min(324px,calc(100vw-32px))] -translate-x-1/2 items-center justify-around rounded-[29px] px-3 md:hidden"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {dockItems.map(({ label, mode, icon: Icon, primary }) => (
        <motion.button
          key={mode}
          type="button"
          aria-label={`Open ${label}`}
          onClick={() => onSelect(mode)}
          whileTap={{ scale: 0.94 }}
          className={`flex h-12 min-w-[76px] flex-col items-center justify-center gap-0.5 rounded-2xl text-[12px] font-medium tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)] focus-visible:ring-offset-2 ${
            primary
              ? "text-[color:var(--hs-green)]"
              : "text-[color:var(--hs-text-secondary)]"
          }`}
        >
          <Icon aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={1.9} />
          <span>{label}</span>
        </motion.button>
      ))}
    </motion.nav>
  );
}
