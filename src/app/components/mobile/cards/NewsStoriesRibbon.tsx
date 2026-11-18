import { useMemo } from "react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { timeAgoFa } from "../utils/fa";
import type { Article } from "../../../data";
import { SPRING_TACTILE, EASE_EDITORIAL, computeStaggerDelay } from "../../../motionChoreography";

type Props = {
  articles: Article[];
  onOpen: (a: Article) => void;
  /** Max stories to show. */
  limit?: number;
};

/**
 * Editorial Feature Stories Carousel — horizontal snap cards with measured
 * contrast scrim, unboxed source kicker, and tactile spring feedback.
 */
export function NewsStoriesRibbon({ articles, onOpen, limit = 8 }: Props) {
  const stories = useMemo(() => {
    return articles.filter((a) => a.image).slice(0, limit);
  }, [articles, limit]);

  if (stories.length === 0) return null;

  return (
    <section className="mt-1.5 mb-1" dir="rtl" aria-label="گزیده داستان‌های امروز">
      <header className="px-4 mb-2 flex items-baseline justify-between">
        <h3 className="font-display text-[15px] font-semibold text-[var(--foreground)]">
          گزیدهٔ امروز
        </h3>
        <span className="text-[11px] text-[var(--foreground-subtle)] tabular-nums">
          {stories.length.toLocaleString("fa-IR")} گزارش تصویری
        </span>
      </header>

      <div className="overflow-x-auto scrollbar-none snap-x snap-mandatory">
        <ul className="flex gap-3 px-4 pb-2">
          {stories.map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.22,
                delay: computeStaggerDelay(i, 24, 160),
                ease: EASE_EDITORIAL,
              }}
              className="snap-start shrink-0"
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={SPRING_TACTILE}
                onClick={() => onOpen(a)}
                className="group relative w-[248px] h-[304px] rounded-[20px] overflow-hidden tap text-right shadow-[var(--shadow-md)] border border-black/5 dark:border-white/10"
              >
                <ImageWithFallback
                  src={a.image!}
                  alt={a.title}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />
                {/* Measured WCAG contrast scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

                <div className="absolute inset-x-0 bottom-0 p-4 text-white flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80 tabular-nums">
                    <span>{a.sourceIcon}</span>
                    <span className="font-medium truncate max-w-[120px]">{a.source}</span>
                    <span aria-hidden="true">·</span>
                    <span>{a.publishedAt ? timeAgoFa(a.publishedAt) : a.date}</span>
                  </div>
                  <div className="font-display text-[15.5px] font-semibold leading-[1.45] line-clamp-3 headline-balance">
                    {a.title}
                  </div>
                </div>
              </motion.button>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
