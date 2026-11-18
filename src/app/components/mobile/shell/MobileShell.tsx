import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MobileBottomNav, type MobileTab } from "./MobileBottomNav";
import { ToastProvider } from "../primitives/Toast";
import { OfflineBanner } from "../primitives/OfflineBanner";
import {
  MOBILE_TAB_ORDER,
  EASE_EDITORIAL,
  computeDirectionalSlide,
} from "../../../motionChoreography";

type Props = {
  /** Render-prop per tab so each screen owns its TopBar + body. */
  renderTab: (tab: MobileTab, setTab: (t: MobileTab) => void) => ReactNode;
  badges?: Partial<Record<MobileTab, number>>;
  /** Overlays (reader, sheets) rendered above tabs but below toasts. */
  overlays?: ReactNode;
  initialTab?: MobileTab;
};

/**
 * Top-level mobile container with RTL-coherent directional spring transitions
 * across the 5 bottom navigation tabs.
 */
export function MobileShell({ renderTab, badges, overlays, initialTab = "home" }: Props) {
  const [tab, setTabState] = useState<MobileTab>(initialTab);
  const prevTabRef = useRef<MobileTab>(initialTab);

  const setTab = (next: MobileTab) => {
    if (next === tab) return;
    prevTabRef.current = tab;
    setTabState(next);
  };

  const slide = computeDirectionalSlide(prevTabRef.current, tab, MOBILE_TAB_ORDER, {
    isRtl: true,
    distancePx: 18,
  });

  return (
    <ToastProvider>
      <div
        dir="rtl"
        lang="fa"
        className="kian-mobile-theme md:hidden fixed inset-0 bg-[var(--background)] text-[var(--foreground)] overflow-hidden"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: slide.enterX }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slide.exitX }}
            transition={{ duration: 0.2, ease: EASE_EDITORIAL }}
            className="size-full"
          >
            {renderTab(tab, setTab)}
          </motion.div>
        </AnimatePresence>
        <OfflineBanner />
        <MobileBottomNav active={tab} onChange={setTab} badges={badges} />
        {overlays}
      </div>
    </ToastProvider>
  );
}
