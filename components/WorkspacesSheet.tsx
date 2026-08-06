"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Cafe } from "@/types/cafe";
import CafeDetails from "./CafeDetails";

interface WorkspacesSheetProps {
  selectedCafe: Cafe | null;
  setSelectedCafe: React.Dispatch<React.SetStateAction<Cafe | null>>;
}

export default function WorkspacesSheet({
  selectedCafe,
  setSelectedCafe,
}: WorkspacesSheetProps) {
  return (
    <AnimatePresence>
      {selectedCafe && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/10 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCafe(null)}
          />

          {/* Sheet */}
          <motion.div
    drag="y"
    dragConstraints={{
        top: -350,
        bottom: 0,
    }}
    dragElastic={0.08}
            className="
              fixed
              bottom-0
              left-0
              right-0
              h-[45vh]
              bg-white
              rounded-t-[32px]
              shadow-2xl
              z-50
              overflow-y-auto
              md:hidden
            "
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 30,
            }}
          >
            <div className="flex justify-center py-3">
              <div className="w-14 h-1.5 rounded-full bg-slate-300" />
            </div>

            <CafeDetails cafe={selectedCafe} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}