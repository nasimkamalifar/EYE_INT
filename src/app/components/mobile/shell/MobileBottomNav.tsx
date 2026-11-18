import { Home, Search, Bookmark, Globe2, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { motion } from "motion/react";
import { useHaptics } from "../hooks";
import { SPRING_SNAPPY, SPRING_TACTILE } from "../../../motionChoreography";

export type MobileTab = "home" | "international" | "discover" | "saved" | "me";

type TabDef = {
  id: MobileTab;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Center tab renders as a raised circular FAB. */
  center?: boolean;
};

const TABS: TabDef[] = [
  { id: "home",          label: "خانه",      Icon: Home },
  { id: "international", label: "بین‌الملل", Icon: Globe2 },
  { id: "discover",      label: "کاوش",      Icon: Search, center: true },
  { id: "saved",         label: "ذخیره",     Icon: Bookmark },
  { id: "me",            label: "من",        Icon: User },
];

export function MobileBottomNav({
  active,
  onChange,
  badges,
}: {
  active: MobileTab;
  onChange: (t: MobileTab) => void;
  badges?: Partial<Record<MobileTab, number>>;
}) {
  const haptic = useHaptics();
  const center = TABS.find((t) => t.center)!;

  const press = (id: MobileTab) => {
    if (active !== id) haptic("select");
    onChange(id);
  };

  const W = 375;
  const H = 64;
  const BAR_TOP = 8;
  const CX = W / 2;
  const NOTCH_R = 34;

  const barPath =
    `M 0 ${BAR_TOP} ` +
    `L ${CX - NOTCH_R} ${BAR_TOP} ` +
    `A ${NOTCH_R} ${NOTCH_R} 0 0 0 ${CX + NOTCH_R} ${BAR_TOP} ` +
    `L ${W} ${BAR_TOP} ` +
    `L ${W} ${H} ` +
    `L 0 ${H} Z`;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-mobile-bottomnav)] kian-bottomnav"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="پیمایش پایین"
    >
      <div className="relative w-full" style={{ height: `${H}px` }}>
        <svg
          className="absolute inset-0 w-full h-full kian-bottomnav-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={barPath} fill="var(--card)" />
        </svg>

        <ul className="absolute left-0 right-0 grid grid-cols-5 h-full">
          {TABS.map((t) => {
            if (t.center) return <li key={t.id} aria-hidden="true" />;
            const on = active === t.id;
            const b = badges?.[t.id];
            return (
              <li key={t.id} className="flex items-end justify-center pb-1.5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  transition={SPRING_TACTILE}
                  onClick={() => press(t.id)}
                  aria-current={on ? "page" : undefined}
                  aria-label={t.label}
                  className="relative min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 tap rounded-full"
                >
                  <t.Icon
                    className={
                      on
                        ? "size-[21px] text-[var(--foreground)] transition-colors"
                        : "size-[21px] text-[var(--foreground-subtle)] transition-colors"
                    }
                    strokeWidth={on ? 2.2 : 1.75}
                  />
                  <span
                    className={`text-[10px] leading-none ${
                      on ? "font-semibold text-[var(--foreground)]" : "font-medium text-[var(--foreground-subtle)]"
                    }`}
                  >
                    {t.label}
                  </span>
                  {!!b && (
                    <span className="absolute top-0.5 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--brand-500)] text-white text-[9px] grid place-items-center font-bold tabular-nums">
                      {b > 99 ? "+۹۹" : b.toLocaleString("fa-IR")}
                    </span>
                  )}
                  {on && (
                    <motion.span
                      layoutId="mobile-bottomnav-active-dot"
                      transition={SPRING_SNAPPY}
                      aria-hidden="true"
                      className="absolute -bottom-0.5 w-4 h-[2.5px] rounded-full bg-[var(--brand-500)]"
                    />
                  )}
                </motion.button>
              </li>
            );
          })}
        </ul>

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={SPRING_TACTILE}
          onClick={() => press(center.id)}
          aria-current={active === center.id ? "page" : undefined}
          aria-label={center.label}
          className={`absolute left-1/2 -translate-x-1/2 -top-3.5 size-[52px] rounded-full grid place-items-center tap kian-bottomnav-fab ${
            active === center.id
              ? "bg-[var(--brand-500)] text-white"
              : "bg-[var(--foreground)] text-[var(--card)]"
          }`}
        >
          <center.Icon className="size-5" strokeWidth={2.3} />
        </motion.button>
      </div>
    </nav>
  );
}
