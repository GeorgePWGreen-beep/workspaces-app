"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { Cafe } from "@/types/cafe";
import CafeDetails from "./CafeDetails";

interface WorkspacesSheetProps {
  selectedCafe: Cafe | null;
  setSelectedCafe: React.Dispatch<React.SetStateAction<Cafe | null>>;
}

type SheetState = "closed" | "collapsed" | "expanded";
type OpenSheetState = Exclude<SheetState, "closed">;

interface DragSession {
  pointerId: number;
  startY: number;
  startOffset: number;
  startState: OpenSheetState;
  isDragging: boolean;
  lastY: number;
  lastTimestamp: number;
  velocityY: number;
}

const COLLAPSED_VISIBLE_PORTION = 0.45;
const SHEET_VISIBLE_PORTION = 0.95;
const EXPAND_DISTANCE_RATIO = 0.3;
const COLLAPSE_DISTANCE_RATIO = 0.25;
const DISMISS_DISTANCE_RATIO = 0.32;
const EXPAND_VELOCITY = -650;
const COLLAPSE_VELOCITY = 650;
const DISMISS_VELOCITY = 850;
const DIRECTION_THRESHOLD = 8;
const DRAG_RESISTANCE = 0.2;
const SPRING = {
  type: "spring" as const,
  stiffness: 360,
  damping: 38,
  mass: 0.8,
};

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, [contenteditable='true'], [role='button'], [data-sheet-interactive]";

function getCollapsedOffset(sheetHeight?: number) {
  if (typeof window === "undefined") return 0;

  const viewportHeight = window.innerHeight;
  const expandedHeight = sheetHeight ?? viewportHeight * SHEET_VISIBLE_PORTION;

  return Math.max(
    0,
    Math.round(expandedHeight - viewportHeight * COLLAPSED_VISIBLE_PORTION),
  );
}

function getClosedOffset(sheetHeight?: number) {
  if (typeof window === "undefined") return 0;

  return sheetHeight ?? Math.round(window.innerHeight * SHEET_VISIBLE_PORTION);
}

function getOffsetForState(state: OpenSheetState, collapsedOffset: number) {
  return state === "expanded" ? 0 : collapsedOffset;
}

function applyDragResistance(offset: number, collapsedOffset: number) {
  if (offset < 0) return 0;

  if (offset > collapsedOffset) {
    return collapsedOffset + (offset - collapsedOffset) * DRAG_RESISTANCE;
  }

  return offset;
}

function getReleaseState(
  startState: OpenSheetState,
  dragDistance: number,
  velocityY: number,
  collapsedOffset: number,
): SheetState {
  if (startState === "collapsed") {
    if (
      velocityY >= DISMISS_VELOCITY ||
      dragDistance >= collapsedOffset * DISMISS_DISTANCE_RATIO
    ) {
      return "closed";
    }

    if (
      velocityY <= EXPAND_VELOCITY ||
      dragDistance <= -collapsedOffset * EXPAND_DISTANCE_RATIO
    ) {
      return "expanded";
    }

    return "collapsed";
  }

  if (
    velocityY >= COLLAPSE_VELOCITY ||
    dragDistance >= collapsedOffset * COLLAPSE_DISTANCE_RATIO
  ) {
    return "collapsed";
  }

  return "expanded";
}

export default function WorkspacesSheet({
  selectedCafe,
  setSelectedCafe,
}: WorkspacesSheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const stopAnimationRef = useRef<(() => void) | null>(null);
  const transitionIdRef = useRef(0);
  const wasOpenRef = useRef(false);
  const closeAfterCollapseRef = useRef(false);
  const closeSheetRef = useRef<() => void>(() => undefined);
  const animateToStateRef = useRef<((nextState: OpenSheetState) => void) | null>(
    null,
  );
  const [sheetState, setSheetState] = useState<SheetState>("closed");
  const [isClosing, setIsClosing] = useState(false);
  const [isContentScrollable, setIsContentScrollable] = useState(false);
  const [collapsedOffset, setCollapsedOffset] = useState(() =>
    getCollapsedOffset(),
  );
  const sheetY = useMotionValue(getClosedOffset());

  const stopCurrentAnimation = () => {
    transitionIdRef.current += 1;
    stopAnimationRef.current?.();
    stopAnimationRef.current = null;
  };

  const animateToState = useCallback(
    (nextState: OpenSheetState) => {
      stopCurrentAnimation();
      setSheetState(nextState);

      if (nextState === "collapsed") {
        setIsContentScrollable(false);
        contentRef.current?.scrollTo({ top: 0 });
      }

      const transitionId = transitionIdRef.current;
      const controls = animate(
        sheetY,
        getOffsetForState(nextState, collapsedOffset),
        SPRING,
      );

      stopAnimationRef.current = controls.stop;

      void controls.then(() => {
        if (transitionId !== transitionIdRef.current) return;

        stopAnimationRef.current = null;

        if (nextState === "collapsed" && closeAfterCollapseRef.current) {
          closeAfterCollapseRef.current = false;
          closeSheetRef.current();
          return;
        }

        setIsContentScrollable(nextState === "expanded");
      });
    },
    [collapsedOffset, sheetY],
  );

  const closeSheet = useCallback(() => {
    if (sheetState === "closed" || isClosing) return;

    if (sheetState === "expanded") {
      closeAfterCollapseRef.current = true;
      animateToState("collapsed");
      return;
    }

    stopCurrentAnimation();
    dragSessionRef.current = null;
    setIsClosing(true);
    setSheetState("closed");
    setIsContentScrollable(false);

    const transitionId = transitionIdRef.current;
    const controls = animate(
      sheetY,
      getClosedOffset(sheetRef.current?.offsetHeight),
      SPRING,
    );

    stopAnimationRef.current = controls.stop;

    void controls.then(() => {
      if (transitionId !== transitionIdRef.current) return;

      stopAnimationRef.current = null;
      setIsClosing(false);
      setSelectedCafe(null);
    });
  }, [animateToState, isClosing, setSelectedCafe, sheetState, sheetY]);

  useEffect(() => {
    closeSheetRef.current = closeSheet;
  }, [closeSheet]);

  useEffect(() => {
    animateToStateRef.current = animateToState;
  }, [animateToState]);

  useEffect(() => {
    if (!selectedCafe) {
      wasOpenRef.current = false;
      stopCurrentAnimation();
      sheetY.set(getClosedOffset(sheetRef.current?.offsetHeight));
      return;
    }

    if (wasOpenRef.current) return;

    wasOpenRef.current = true;
    sheetY.set(getClosedOffset(sheetRef.current?.offsetHeight));
    const frame = window.requestAnimationFrame(() => {
      animateToStateRef.current?.("collapsed");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedCafe, sheetY]);

  useEffect(() => {
    if (!selectedCafe) return;

    const updateOffsets = () => {
      setCollapsedOffset(getCollapsedOffset(sheetRef.current?.offsetHeight));
    };

    updateOffsets();
    window.addEventListener("resize", updateOffsets);
    window.visualViewport?.addEventListener("resize", updateOffsets);

    return () => {
      window.removeEventListener("resize", updateOffsets);
      window.visualViewport?.removeEventListener("resize", updateOffsets);
    };
  }, [selectedCafe, sheetState]);

  useEffect(() => {
    const sheet = sheetRef.current;

    if (!sheet) return;

    const preventNativePullDown = (event: TouchEvent) => {
      const dragSession = dragSessionRef.current;

      if (!dragSession || dragSession.startState !== "expanded") return;

      const touch = event.touches[0];

      if (!touch) return;

      const pullDistance = touch.clientY - dragSession.startY;

      // Keep WebKit from taking over a downward pull before the sheet can
      // assume control. Upward gestures still use the browser's native scroll.
      if (dragSession.isDragging || pullDistance >= DIRECTION_THRESHOLD) {
        event.preventDefault();
      }
    };

    sheet.addEventListener("touchmove", preventNativePullDown, {
      capture: true,
      passive: false,
    });

    return () => {
      sheet.removeEventListener("touchmove", preventNativePullDown, {
        capture: true,
      });
    };
  }, [sheetState]);

  const isInteractiveTarget = (target: EventTarget | null) => {
    return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
  };

  const beginDrag = (
    event: React.PointerEvent<HTMLElement>,
    startState: OpenSheetState,
  ) => {
    stopCurrentAnimation();
    closeAfterCollapseRef.current = false;
    dragSessionRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: getOffsetForState(startState, collapsedOffset),
      startState,
      isDragging: true,
      lastY: event.clientY,
      lastTimestamp: event.timeStamp,
      velocityY: 0,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (isClosing || sheetState === "closed" || isInteractiveTarget(event.target)) {
      return;
    }

    if (sheetState === "collapsed") {
      beginDrag(event, "collapsed");
      return;
    }

    const scrollTop = contentRef.current?.scrollTop ?? 0;

    if (isContentScrollable && scrollTop <= 1) {
      dragSessionRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startOffset: 0,
        startState: "expanded",
        isDragging: false,
        lastY: event.clientY,
        lastTimestamp: event.timeStamp,
        velocityY: 0,
      };
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const dragSession = dragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) return;

    const dragDistance = event.clientY - dragSession.startY;

    if (!dragSession.isDragging) {
      if (dragDistance <= -DIRECTION_THRESHOLD) {
        // Continue native scrolling for upward gestures.
        dragSessionRef.current = null;
        return;
      }

      if (dragDistance < DIRECTION_THRESHOLD) return;

      dragSession.isDragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      stopCurrentAnimation();
    }

    const elapsed = Math.max(event.timeStamp - dragSession.lastTimestamp, 1);
    dragSession.velocityY = ((event.clientY - dragSession.lastY) / elapsed) * 1000;
    dragSession.lastY = event.clientY;
    dragSession.lastTimestamp = event.timeStamp;

    sheetY.set(
      applyDragResistance(
        dragSession.startOffset + dragDistance,
        collapsedOffset,
      ),
    );
  };

  const finishDrag = (event: React.PointerEvent<HTMLElement>) => {
    const dragSession = dragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) return;

    dragSessionRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!dragSession.isDragging) return;

    const dragDistance = event.clientY - dragSession.startY;
    const velocityY =
      event.timeStamp - dragSession.lastTimestamp > 100
        ? 0
        : dragSession.velocityY;
    const nextState = getReleaseState(
      dragSession.startState,
      dragDistance,
      velocityY,
      collapsedOffset,
    );

    if (nextState === "closed") {
      closeSheet();
      return;
    }

    animateToState(nextState);
  };

  const cancelDrag = (event: React.PointerEvent<HTMLElement>) => {
    const dragSession = dragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) return;

    dragSessionRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (dragSession.isDragging) animateToState(dragSession.startState);
  };

  const isVisible = Boolean(selectedCafe) && (sheetState !== "closed" || isClosing);

  if (!isVisible || !selectedCafe) return null;

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close cafe details"
        className="fixed inset-0 z-40 bg-black/10 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: sheetState === "closed" ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        onClick={closeSheet}
      />

      <motion.section
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${selectedCafe.name} details`}
        className={`fixed inset-x-0 bottom-0 z-50 flex h-[95dvh] flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl md:hidden ${
          sheetState === "collapsed" ? "touch-none" : ""
        }`}
        style={{ y: sheetY }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
      >
        <div className="flex shrink-0 justify-center px-4 pb-3 pt-4">
          <div
            aria-hidden="true"
            className="flex h-8 w-20 items-center justify-center"
          >
            <div className="h-[5px] w-13 rounded-full bg-slate-400" />
          </div>
        </div>

        <div
          ref={contentRef}
          className={`min-h-0 flex-1 overscroll-contain pb-[env(safe-area-inset-bottom)] ${
            isContentScrollable ? "overflow-y-auto touch-pan-y" : "overflow-y-hidden"
          }`}
        >
          <CafeDetails cafe={selectedCafe} />
        </div>
      </motion.section>
    </>
  );
}
