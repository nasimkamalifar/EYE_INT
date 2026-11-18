import {
  Star, CheckCheck, RefreshCw, SlidersHorizontal, LayoutGrid, List, Newspaper,
  Share2, ArrowDownAZ, ArrowUpZA, Calendar, Inbox, Languages, Loader2, Rows3,
} from "lucide-react";
import { useMemo, useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { toast } from "sonner";
import { Article } from "../data";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { DensityToggle } from "./kian";
import {
  SPRING_SNAPPY, SPRING_TACTILE, EASE_EDITORIAL,
  computeStaggerDelay, computeSpotlightCoords,
} from "../motionChoreography";

// Fallback language guess for cached/legacy articles that lack a server `lang`.
function looksNonPersian(title: string): boolean {
  const t = String(title || "");
  if (!t.trim()) return false;
  const arabicScript = (t.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (t.match(/[A-Za-z\u0400-\u04FF\u0370-\u03FF]/g) || []).length;
  return latin > 0 && latin >= arabicScript;
}

function needsFa(a: Article): boolean {
  if (a.titleTranslated || !a.title) return false;
  return a.lang ? a.lang !== "fa" : looksNonPersian(a.title);
}

const ROW_H = 68;
const VIRT_THRESHOLD = 80;

export type SortMode = "newest" | "oldest" | "source";

type Props = {
  articles: Article[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  viewMode: "cards" | "list" | "magazine";
  setViewMode: (v: "cards" | "list" | "magazine") => void;
  title: string;
  toggleStar: (id: string) => void;
  sortMode?: SortMode;
  setSortMode?: (s: SortMode) => void;
  onRefresh?: () => void;
  onMarkAllRead?: () => void;
  loading?: boolean;
  translateAll?: boolean;
  onToggleTranslateAll?: () => void;
  onTranslate?: (ids: string[]) => void;
  translatingIds?: Set<string>;
  subHeader?: ReactNode;
};

function parseDate(s: string): number {
  const t = new Date(s).getTime();
  return isNaN(t) ? 0 : t;
}

function handleCardSpotlight(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const { x, y } = computeSpotlightCoords(e.clientX, e.clientY, rect);
  el.style.setProperty("--spot-x", `${x}px`);
  el.style.setProperty("--spot-y", `${y}px`);
}

export function ArticleList({
  articles,
  selectedId,
  setSelectedId,
  viewMode,
  setViewMode,
  title,
  toggleStar,
  sortMode = "newest",
  setSortMode,
  onRefresh,
  onMarkAllRead,
  loading,
  translateAll = false,
  onToggleTranslateAll,
  onTranslate,
  translatingIds,
  subHeader,
}: Props) {
  const isPresent = useIsPresent();
  const sorted = useMemo(() => {
    const arr = [...articles];
    if (sortMode === "newest") arr.sort((a, b) => (b.dateMs ?? parseDate(b.date)) - (a.dateMs ?? parseDate(a.date)));
    else if (sortMode === "oldest") arr.sort((a, b) => (a.dateMs ?? parseDate(a.date)) - (b.dateMs ?? parseDate(b.date)));
    else if (sortMode === "source") arr.sort((a, b) => a.source.localeCompare(b.source, "fa"));
    return arr;
  }, [articles, sortMode]);

  const selectedRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [vRange, setVRange] = useState({ start: 0, end: 60 });
  const [showFilters, setShowFilters] = useState(true);
  const [densityOpen, setDensityOpen] = useState(false);

  const virtualize = viewMode === "list" && sorted.length > VIRT_THRESHOLD;

  useEffect(() => {
    if (!virtualize) {
      selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const top = el.scrollTop;
      const h = el.clientHeight;
      const start = Math.max(0, Math.floor(top / ROW_H) - 8);
      const end = Math.min(sorted.length, Math.ceil((top + h) / ROW_H) + 8);
      setVRange({ start, end });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [virtualize, sorted.length, selectedId]);

  useEffect(() => {
    if (!virtualize) return;
    const idx = sorted.findIndex((a) => a.id === selectedId);
    if (idx < 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const top = idx * ROW_H;
    if (top < el.scrollTop || top + ROW_H > el.scrollTop + el.clientHeight) {
      el.scrollTo({ top: top - el.clientHeight / 2, behavior: "smooth" });
    }
  }, [selectedId, virtualize, sorted]);

  useEffect(() => {
    if (!translateAll || !onTranslate) return;
    const root = scrollRef.current;
    if (!root) return;
    let queued = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      if (queued.size) {
        onTranslate(Array.from(queued));
        queued = new Set();
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = (e.target as HTMLElement).dataset.aid;
            if (id) queued.add(id);
          }
        }
        clearTimeout(timer);
        timer = setTimeout(flush, 300);
      },
      { root, rootMargin: "300px 0px" },
    );
    const observe = () => root.querySelectorAll("[data-aid]").forEach((el) => io.observe(el));
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(timer);
    };
  }, [translateAll, onTranslate, viewMode, sorted]);

  const SortIcon = sortMode === "oldest" ? ArrowUpZA : sortMode === "source" ? ArrowDownAZ : Calendar;
  const nextSort: SortMode = sortMode === "newest" ? "oldest" : sortMode === "oldest" ? "source" : "newest";
  const sortLabel = sortMode === "newest" ? "جدیدترین" : sortMode === "oldest" ? "قدیمی‌ترین" : "بر اساس منبع";
  const isEmpty = !loading && sorted.length === 0;

  const shareCurrentView = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("پیوند نمای فعلی در حافظه کپی شد");
    } catch {
      toast("امکان کپی خودکار پیوند نبود");
    }
  };

  const TransBtn = ({ a }: { a: Article }) => {
    if (!onTranslate || !needsFa(a)) return null;
    const busy = translatingIds?.has(a.id);
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTranslate([a.id]);
        }}
        disabled={busy}
        aria-label="ترجمهٔ تیتر به فارسی"
        title="ترجمهٔ این تیتر به فارسی"
        className="p-1.5 rounded-[var(--radius-xs)] text-[var(--foreground-subtle)] hover:text-[var(--brand-600)] hover:bg-[var(--background-muted)] transition-colors cursor-pointer tactile-btn"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
      </button>
    );
  };

  const StarButton = ({ a }: { a: Article }) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.78 }}
      transition={SPRING_TACTILE}
      onClick={(e) => {
        e.stopPropagation();
        toggleStar(a.id);
      }}
      aria-label={a.starred ? `حذف نشان از ${a.title}` : `نشان‌دار کردن ${a.title}`}
      title={a.starred ? "حذف نشان" : "نشان‌دار کردن"}
      className="p-1.5 rounded-[var(--radius-xs)] hover:bg-[var(--background-muted)] text-[var(--foreground-subtle)] hover:text-amber-500 transition-colors cursor-pointer shrink-0"
    >
      <motion.span
        key={a.starred ? "starred" : "unstarred"}
        initial={{ scale: 0.75 }}
        animate={{ scale: 1 }}
        transition={SPRING_TACTILE}
        className="block"
      >
        <Star className={`w-4 h-4 ${a.starred ? "fill-amber-400 text-amber-400" : ""}`} />
      </motion.span>
    </motion.button>
  );

  const viewModes = [
    { id: "cards" as const, label: "کارت‌ها", icon: LayoutGrid },
    { id: "list" as const, label: "لیست", icon: List },
    { id: "magazine" as const, label: "مجله", icon: Newspaper },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)] min-w-0 min-h-0 h-full">
      {/* Sticky Glass Editorial Toolbar */}
      <div className="border-b border-[var(--border-subtle)] px-4 py-2.5 flex items-center gap-1 sticky top-0 glass z-10">
        <div className="flex-1 min-w-[130px] flex items-baseline gap-1.5">
          <h2 className="font-display text-[17px] lg:text-[18.5px] font-semibold tracking-tight text-[var(--foreground)] truncate">
            {title}
          </h2>
          <span className="text-[11.5px] text-[var(--foreground-subtle)] tabular-nums whitespace-nowrap shrink-0">
            · {sorted.length.toLocaleString("fa-IR")}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="بروزرسانی فهرست"
          title="بروزرسانی"
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] disabled:opacity-50 cursor-pointer tactile-btn"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--brand-600)]" : ""}`} />
        </button>

        <button
          type="button"
          onClick={onMarkAllRead}
          aria-label="علامت‌گذاری همه به عنوان خوانده‌شده"
          title="علامت‌گذاری همه به عنوان خوانده‌شده"
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] cursor-pointer tactile-btn"
        >
          <CheckCheck className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setSortMode?.(nextSort)}
          aria-label={`مرتب‌سازی: ${sortLabel}`}
          title={`ترتیب فعلی: ${sortLabel} (کلیک برای تغییر)`}
          className="p-1.5 2xl:px-2 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] flex items-center gap-1.5 text-xs cursor-pointer tactile-btn whitespace-nowrap shrink-0"
        >
          <SortIcon className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline">{sortLabel}</span>
        </button>

        {subHeader && (
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-label="نمایش یا پنهان‌کردن نوار فیلتر موضوعی"
            title="نوار تمرکز و فیلتر هوشمند"
            className={`p-2 rounded-[var(--radius-sm)] cursor-pointer tactile-btn ${
              showFilters
                ? "bg-[var(--background-muted)] text-[var(--foreground)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

        {onToggleTranslateAll && (
          <button
            type="button"
            onClick={onToggleTranslateAll}
            aria-pressed={translateAll}
            title={
              translateAll
                ? "ترجمه خودکار تیترها روشن است — برای خاموش کردن کلیک کنید"
                : "ترجمه همهٔ تیترهای غیرفارسی به فارسی هنگام پیمایش"
            }
            className={`p-1.5 2xl:px-2.5 rounded-[var(--radius-sm)] flex items-center gap-1.5 text-xs cursor-pointer tactile-btn whitespace-nowrap shrink-0 ${
              translateAll
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-xs)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]"
            }`}
          >
            {translatingIds && translatingIds.size > 0 ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Languages className="w-3.5 h-3.5" />
            )}
            <span className="hidden 2xl:inline">ترجمه همه</span>
          </button>
        )}

        <div className="w-px h-4 bg-[var(--border-subtle)] mx-0.5 shrink-0" />

        {/* Spring-Choreographed View Mode Segmented Switcher */}
        <div
          role="group"
          aria-label="حالت نمایش مقالات"
          className="flex items-center bg-[var(--background-muted)] rounded-[var(--radius-sm)] p-0.5 shrink-0"
        >
          {viewModes.map((m) => {
            const Icon = m.icon;
            const active = viewMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setViewMode(m.id)}
                aria-pressed={active}
                aria-label={`نمایش ${m.label}`}
                title={m.label}
                className={`relative p-1.5 rounded-[calc(var(--radius-sm)-2px)] transition-colors cursor-pointer ${
                  active
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
                }`}
              >
                {active && isPresent && (
                  <motion.span
                    layoutId="article-viewmode-pill"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-[calc(var(--radius-sm)-2px)] bg-[var(--card)] shadow-[var(--shadow-xs)]"
                  />
                )}
                <Icon className="relative z-10 w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={shareCurrentView}
          aria-label="اشتراک‌گذاری این نما"
          title="کپی پیوند این نما"
          className="p-2 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] cursor-pointer tactile-btn"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setDensityOpen((o) => !o)}
            aria-expanded={densityOpen}
            aria-label="تراکم نمایش"
            title="تراکم ردیف‌ها"
            className={`p-2 rounded-[var(--radius-sm)] cursor-pointer tactile-btn ${
              densityOpen
                ? "bg-[var(--background-muted)] text-[var(--foreground)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]"
            }`}
          >
            <Rows3 className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {densityOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDensityOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.15, ease: EASE_EDITORIAL }}
                  className="absolute left-0 top-full mt-1.5 z-40 p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--popover)] shadow-[var(--shadow-lg)] min-w-[200px]"
                  dir="rtl"
                >
                  <div className="text-[11px] font-medium text-[var(--foreground-subtle)] mb-2 px-0.5">
                    تراکم نمایش فهرست
                  </div>
                  <DensityToggle className="w-full" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Animated Filter SubHeader Disclosure */}
      <AnimatePresence initial={false}>
        {subHeader && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: EASE_EDITORIAL }}
            className="shrink-0 overflow-visible z-10"
          >
            {subHeader}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Scrollable Feed Viewport */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        {loading && articles.length === 0 && (
          <div className="divide-y divide-[var(--border-subtle)]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-3.5 flex items-start gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full mt-2 bg-[var(--border)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-[var(--background-muted)] rounded" />
                  <div className="h-4 w-3/4 bg-[var(--background-muted)] rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: EASE_EDITORIAL }}
            className="p-16 text-center text-[var(--foreground-subtle)] flex flex-col items-center gap-3"
          >
            <div className="size-12 rounded-2xl bg-[var(--background-muted)] grid place-items-center">
              <Inbox className="w-6 h-6 text-[var(--foreground-subtle)]" />
            </div>
            <div className="text-sm font-medium text-[var(--foreground)]">مقاله‌ای در این نما یافت نشد</div>
            <div className="text-xs max-w-xs">خوراک تازه‌ای اضافه کنید یا فیلترهای موضوعی را بازنشانی نمایید.</div>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="mt-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium cursor-pointer tactile-btn"
              >
                بروزرسانی خوراک‌ها
              </button>
            )}
          </motion.div>
        )}

        {/* 1. LIST MODE — High-density scannability with gliding active selection bar */}
        {viewMode === "list" && !isEmpty && (
          virtualize ? (
            <div style={{ height: sorted.length * ROW_H, position: "relative" }}>
              <div className="divide-y divide-[var(--border-subtle)] absolute left-0 right-0" style={{ top: vRange.start * ROW_H }}>
                {sorted.slice(vRange.start, vRange.end).map((a) => {
                  const isSelected = selectedId === a.id;
                  return (
                    <div
                      key={a.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(a.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(a.id);
                        }
                      }}
                      style={{ height: ROW_H }}
                      data-aid={a.id}
                      className={`group topic-row relative cursor-pointer w-full px-6 flex items-center gap-3.5 text-right transition-colors ${
                        isSelected
                          ? "bg-[var(--accent)]/55 dark:bg-[var(--brand-500)]/14"
                          : "hover:bg-[var(--background-subtle)]"
                      } ${a.read && !isSelected ? "opacity-65" : ""}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 ${
                          a.read ? "bg-transparent scale-50" : "bg-[var(--brand-500)] scale-100"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--foreground-subtle)] mb-0.5 tabular-nums">
                          <span>{a.sourceIcon}</span>
                          <span className="truncate max-w-[140px] font-medium text-[var(--foreground-muted)]">{a.source}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-[140px]">{a.date}</span>
                          {a.readTime && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{a.readTime}</span>
                            </>
                          )}
                        </div>
                        <div className="text-[14px] font-medium text-[var(--foreground)] truncate transition-transform duration-150 group-hover:-translate-x-0.5">
                          {a.title}
                        </div>
                      </div>
                      <TransBtn a={a} />
                      <StarButton a={a} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {sorted.map((a, idx) => {
                const isSelected = selectedId === a.id;
                return (
                  <motion.div
                    key={a.id}
                    ref={isSelected ? selectedRef : undefined}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: computeStaggerDelay(idx, 14, 140),
                      ease: EASE_EDITORIAL,
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(a.id);
                      }
                    }}
                    data-aid={a.id}
                    style={{
                      paddingTop: "var(--density-row-y, 0.65rem)",
                      paddingBottom: "var(--density-row-y, 0.65rem)",
                    }}
                    className={`group topic-row relative cursor-pointer w-full px-6 flex items-start gap-3.5 text-right transition-colors ${
                      isSelected ? "" : "hover:bg-[var(--background-subtle)]"
                    } ${a.read && !isSelected ? "opacity-65" : ""}`}
                  >
                    {isSelected && isPresent && (
                      <motion.span
                        layoutId="article-list-active-row"
                        transition={SPRING_SNAPPY}
                        className="absolute inset-0 bg-[var(--accent)]/55 dark:bg-[var(--brand-500)]/14 pointer-events-none"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`relative z-10 w-1.5 h-1.5 rounded-full mt-2.5 shrink-0 transition-transform duration-200 ${
                        a.read ? "bg-transparent scale-50" : "bg-[var(--brand-500)] scale-100"
                      }`}
                    />
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--foreground-subtle)] mb-0.5 tabular-nums">
                        <span>{a.sourceIcon}</span>
                        <span className="font-medium text-[var(--foreground-muted)]">{a.source}</span>
                        <span aria-hidden="true">·</span>
                        <span>{a.date}</span>
                        {a.readTime && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{a.readTime}</span>
                          </>
                        )}
                      </div>
                      <div className="text-[14.5px] font-medium text-[var(--foreground)] leading-snug truncate transition-transform duration-150 group-hover:-translate-x-0.5">
                        {a.title}
                      </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-0.5">
                      <TransBtn a={a} />
                      <StarButton a={a} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}

        {/* 2. CARDS MODE — 3-Tier Editorial Salience (Lead Feature + Curated Grid) */}
        {viewMode === "cards" && !isEmpty && (
          <div className="p-6 grid gap-5 grid-cols-1 lg:grid-cols-2">
            {sorted.map((a, idx) => {
              const isSelected = selectedId === a.id;
              const isLead = idx === 0;
              return (
                <motion.article
                  key={a.id}
                  data-aid={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: computeStaggerDelay(idx, 22, 180),
                    ease: EASE_EDITORIAL,
                  }}
                  onPointerMove={handleCardSpotlight}
                  onClick={() => setSelectedId(a.id)}
                  className={`group editorial-spotlight topic-row cursor-pointer bg-[var(--card)] border rounded-[var(--radius-lg)] overflow-hidden transition-colors ${
                    isLead ? "lg:col-span-2 grid lg:grid-cols-12 items-stretch" : "flex flex-col"
                  } ${
                    isSelected
                      ? "border-[var(--brand-500)] ring-1 ring-[var(--brand-500)]/40"
                      : "border-[var(--border-subtle)] hover:border-[var(--border)]"
                  } ${a.read && !isSelected ? "opacity-75" : ""}`}
                >
                  {(isLead || a.image) && (
                    <div
                      className={`overflow-hidden bg-[var(--background-muted)] ${
                        isLead ? "lg:col-span-7 aspect-[16/10] lg:aspect-auto lg:min-h-[240px]" : "aspect-[16/10]"
                      }`}
                    >
                      <ImageWithFallback
                        src={a.image}
                        alt={a.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className={`p-5 flex flex-col justify-between flex-1 ${isLead ? "lg:col-span-5" : ""}`}>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--foreground-subtle)] mb-2 tabular-nums">
                        <span>{a.sourceIcon}</span>
                        <span className="font-medium text-[var(--foreground-muted)]">{a.source}</span>
                        <span aria-hidden="true">·</span>
                        <span>{a.date}</span>
                      </div>
                      <h3
                        className={`font-display font-semibold text-[var(--foreground)] headline-balance mb-2 ${
                          isLead ? "text-[21px] leading-[1.45]" : "text-[17px] leading-[1.5] line-clamp-2"
                        }`}
                      >
                        {a.title}
                      </h3>
                      <p className="text-[13.5px] text-[var(--foreground-muted)] leading-relaxed line-clamp-3 mb-4">
                        {a.preview}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--foreground-subtle)] pt-3 border-t border-[var(--border-subtle)]/70 tabular-nums">
                      <span>{a.readTime ? `${a.readTime} مطالعه` : a.author}</span>
                      <div className="flex items-center gap-1">
                        <TransBtn a={a} />
                        <StarButton a={a} />
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* 3. MAGAZINE MODE — Broadsheet Archive Cadence */}
        {viewMode === "magazine" && !isEmpty && (
          <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {sorted.map((a, idx) => {
              const isSelected = selectedId === a.id;
              return (
                <motion.article
                  key={a.id}
                  data-aid={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: computeStaggerDelay(idx, 20, 160),
                    ease: EASE_EDITORIAL,
                  }}
                  onClick={() => setSelectedId(a.id)}
                  className={`group topic-row cursor-pointer flex flex-col sm:flex-row gap-5 pb-6 border-b border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-colors ${
                    isSelected ? "bg-[var(--accent)]/35 p-4 -mx-4 border-transparent" : ""
                  } ${a.read && !isSelected ? "opacity-75" : ""}`}
                >
                  {a.image && (
                    <div className="w-full sm:w-52 aspect-[16/10] shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-[var(--background-muted)]">
                      <ImageWithFallback
                        src={a.image}
                        alt={a.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-subtle)] mb-1.5 tabular-nums">
                        <span>{a.sourceIcon}</span>
                        <span className="font-medium text-[var(--foreground-muted)]">{a.source}</span>
                        {a.author && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{a.author}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{a.date}</span>
                      </div>
                      <h3 className="font-display text-[19px] font-semibold leading-[1.45] text-[var(--foreground)] headline-balance mb-2 group-hover:text-[var(--brand-700)] dark:group-hover:text-[var(--brand-400)] transition-colors">
                        {a.title}
                      </h3>
                      <p className="text-sm text-[var(--foreground-muted)] leading-relaxed line-clamp-2 mb-3">
                        {a.preview}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--foreground-subtle)] tabular-nums">
                      <span>{a.readTime ? `${a.readTime} مطالعه` : ""}</span>
                      <div className="flex items-center gap-1">
                        <TransBtn a={a} />
                        <StarButton a={a} />
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
