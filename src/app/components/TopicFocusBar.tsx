import { useMemo, useState } from "react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import type { Article } from "../data";
import {
  BUILT_IN_TOPICS, type Topic, type FocusMode, type Combinator,
  scoreArticleForTopic, topicColorClasses,
} from "../topics";
import { Eye, EyeOff, Filter, X, Plus, Link2, Check, VolumeX } from "lucide-react";
import { TopicSparkline } from "./TopicSparkline";
import { SMART_FILTERS, type SmartFilterId, applySmartFilter, applyMute } from "../smartFilters";
import { SPRING_SNAPPY, EASE_EDITORIAL } from "../motionChoreography";

function parseDateMs(s: string): number {
  const t = new Date(s).getTime();
  return isNaN(t) ? 0 : t;
}
const SPARK_BUCKETS = 8;

type Props = {
  articles: Article[];
  activeIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  mode: FocusMode;
  onModeChange: (m: FocusMode) => void;
  combinator?: Combinator;
  onCombinatorChange?: (c: Combinator) => void;
  customTopics?: Topic[];
  onAddCustom?: () => void;
  onEditCustom?: (t: Topic) => void;
  smartActive: SmartFilterId | null;
  onSmartChange: (v: SmartFilterId | null) => void;
  muteWords: string[];
  onMuteChange: (arr: string[]) => void;
};

export function TopicFocusBar({
  articles, activeIds, onToggle, onClear, mode, onModeChange,
  combinator = "or", onCombinatorChange,
  customTopics = [], onAddCustom, onEditCustom,
  smartActive, onSmartChange, muteWords, onMuteChange,
}: Props) {
  const isPresent = useIsPresent();
  const allTopics = useMemo(() => [...BUILT_IN_TOPICS, ...customTopics], [customTopics]);
  const [copied, setCopied] = useState(false);
  const [muteOpen, setMuteOpen] = useState(false);
  const [muteInput, setMuteInput] = useState("");

  const smartCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const f of SMART_FILTERS) {
      try { out[f.id] = applyMute(applySmartFilter(articles, f.id), muteWords).length; }
      catch { out[f.id] = 0; }
    }
    return out;
  }, [articles, muteWords]);

  const addMuteWord = () => {
    const w = muteInput.trim();
    if (!w) return;
    if (!muteWords.includes(w)) onMuteChange([...muteWords, w]);
    setMuteInput("");
  };

  const { counts, sparks } = useMemo(() => {
    const counts: Record<string, number> = {};
    const sparks: Record<string, number[]> = {};
    const now = Date.now();
    const span = 24 * 3600 * 1000;
    const bucket = span / SPARK_BUCKETS;
    for (const t of allTopics) {
      let n = 0;
      const arr = new Array(SPARK_BUCKETS).fill(0);
      for (const a of articles) {
        const s = scoreArticleForTopic(a, t);
        if (s.level === "none") continue;
        n++;
        const ts = a.dateMs ?? parseDateMs(a.date);
        if (!ts) continue;
        const age = now - ts;
        if (age < 0 || age > span) continue;
        const idx = Math.min(SPARK_BUCKETS - 1, Math.floor((span - age) / bucket));
        arr[idx]++;
      }
      counts[t.id] = n;
      sparks[t.id] = arr;
    }
    return { counts, sparks };
  }, [articles, allTopics]);

  const copyShareLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("topic", activeIds.join(","));
      url.searchParams.set("mode", mode);
      if (combinator !== "or") url.searchParams.set("combinator", combinator);
      else url.searchParams.delete("combinator");
      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const cycleCombinator = () => {
    const next: Combinator = combinator === "or" ? "and" : combinator === "and" ? "not" : "or";
    onCombinatorChange?.(next);
  };
  const combLabel = combinator === "or" ? "هرکدام" : combinator === "and" ? "همه با هم" : "به‌جز";

  const matchedTotal = activeIds.reduce((s, id) => s + (counts[id] || 0), 0);
  const hasActive = activeIds.length > 0;

  const focusModes: { m: FocusMode; label: string; Icon: any }[] = [
    { m: "highlight", label: "هایلایت اخبار مرتبط", Icon: Eye },
    { m: "dim", label: "محو غیرمرتبط", Icon: EyeOff },
    { m: "filter", label: "فقط مرتبط", Icon: Filter },
  ];

  return (
    <div className="shrink-0 z-10 bg-[var(--background-subtle)]/90 backdrop-blur border-b border-[var(--border-subtle)]">
      <div className="px-5 py-1.5 flex items-center flex-wrap gap-2">
        {/* Spring Segmented Focus Mode */}
        <div
          role="group"
          aria-label="حالت تمرکز موضوعی"
          className="inline-flex items-center p-0.5 rounded-[var(--radius-sm)] bg-[var(--background-muted)] shrink-0"
        >
          {focusModes.map(({ m, label, Icon }) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange(m)}
                aria-pressed={active}
                aria-label={label}
                title={label}
                className={`relative p-1.5 rounded-[calc(var(--radius-sm)-2px)] transition-colors cursor-pointer ${
                  active ? "text-[var(--foreground)]" : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
                }`}
              >
                {active && isPresent && (
                  <motion.span
                    layoutId="topic-focus-mode-pill"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-[calc(var(--radius-sm)-2px)] bg-[var(--card)] shadow-[var(--shadow-xs)]"
                  />
                )}
                <Icon className="relative z-10 w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-[var(--border-subtle)] shrink-0" />

        {onCombinatorChange && activeIds.length > 1 && (
          <>
            <button
              type="button"
              onClick={cycleCombinator}
              title="تغییر ترکیب موضوعات"
              className="shrink-0 px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] bg-[var(--card)] border border-[var(--border-subtle)] hover:bg-[var(--background-muted)] font-medium tabular-nums cursor-pointer tactile-btn whitespace-nowrap"
            >
              {combLabel}
            </button>
            <div className="h-4 w-px bg-[var(--border-subtle)] shrink-0" />
          </>
        )}

        {/* Topics Dropdown */}
        <details className="relative group [&_summary::-webkit-details-marker]:hidden shrink-0">
          <summary
            className={`list-none cursor-pointer select-none flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs transition border whitespace-nowrap ${
              activeIds.length
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent font-medium"
                : "bg-[var(--card)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border-[var(--border-subtle)]"
            }`}
          >
            <span>موضوعات</span>
            {activeIds.length > 0 && (
              <span className="text-[11px] tabular-nums opacity-85">
                · {activeIds.length.toLocaleString("fa-IR")}
              </span>
            )}
            <svg className="w-3 h-3 transition-transform duration-150 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </summary>
          <div className="absolute z-30 mt-1.5 right-0 min-w-[250px] max-h-80 overflow-y-auto bg-[var(--popover)] text-[var(--popover-foreground)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] p-1.5 flex flex-col gap-1">
            {allTopics.map((t) => {
              const cls = topicColorClasses(t.color);
              const active = activeIds.includes(t.id);
              const c = counts[t.id] || 0;
              const disabled = c === 0 && !active;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToggle(t.id)}
                  onDoubleClick={() => t.custom && onEditCustom?.(t)}
                  title={t.custom ? "دابل‌کلیک برای ویرایش" : undefined}
                  disabled={disabled}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors cursor-pointer ${
                    active
                      ? `${cls.chip} font-semibold`
                      : disabled
                        ? "opacity-40 cursor-not-allowed text-[var(--foreground-subtle)]"
                        : "hover:bg-[var(--background-muted)] text-[var(--foreground)]"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span className="font-medium flex-1 text-right truncate">{t.name}</span>
                  {sparks[t.id] && c > 0 && <TopicSparkline buckets={sparks[t.id]} />}
                  <span className="text-[11px] tabular-nums opacity-75">
                    {c.toLocaleString("fa-IR")}
                  </span>
                </button>
              );
            })}
            {onAddCustom && (
              <button
                type="button"
                onClick={onAddCustom}
                title="موضوع سفارشی"
                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-[var(--radius-sm)] text-xs border border-dashed border-[var(--border)] text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] transition cursor-pointer"
              >
                <Plus className="w-3 h-3" /> موضوع سفارشی
              </button>
            )}
          </div>
        </details>

        {/* Smart Filters Dropdown */}
        <details className="relative group [&_summary::-webkit-details-marker]:hidden shrink-0 text-xs">
          <summary
            className={`list-none cursor-pointer select-none flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] border transition whitespace-nowrap ${
              smartActive
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent font-medium"
                : "bg-[var(--card)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border-[var(--border-subtle)]"
            }`}
          >
            {(() => {
              const af = SMART_FILTERS.find((f) => f.id === smartActive);
              return af ? (
                <>
                  <span>{af.icon}</span>
                  <span>{af.name}</span>
                  <span className="tabular-nums opacity-80">· {(smartCounts[af.id] || 0).toLocaleString("fa-IR")}</span>
                </>
              ) : (
                <span>فیلتر هوشمند</span>
              );
            })()}
            <svg className="w-3 h-3 transition-transform duration-150 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </summary>
          <div className="absolute z-30 mt-1.5 right-0 min-w-[220px] max-h-72 overflow-y-auto bg-[var(--popover)] text-[var(--popover-foreground)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] p-1.5">
            <button
              type="button"
              onClick={(e) => {
                onSmartChange(null);
                (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
              }}
              className={`w-full text-right flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] transition cursor-pointer ${
                !smartActive
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold"
                  : "hover:bg-[var(--background-muted)]"
              }`}
            >
              <span className="flex-1">همه (بدون فیلتر)</span>
            </button>
            {SMART_FILTERS.map((f) => {
              const active = smartActive === f.id;
              const c = smartCounts[f.id] || 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={(e) => {
                    onSmartChange(active ? null : f.id);
                    (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                  }}
                  title={f.description}
                  disabled={!active && c === 0}
                  className={`w-full text-right flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] transition cursor-pointer ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold"
                      : c === 0
                        ? "opacity-40 cursor-not-allowed text-[var(--foreground-subtle)]"
                        : "hover:bg-[var(--background-muted)]"
                  }`}
                >
                  <span className="shrink-0">{f.icon}</span>
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="tabular-nums text-[11px] opacity-70">{c.toLocaleString("fa-IR")}</span>
                </button>
              );
            })}
          </div>
        </details>

        <button
          type="button"
          onClick={() => setMuteOpen((o) => !o)}
          aria-expanded={muteOpen}
          title="بی‌صدا کردن کلیدواژه‌ها"
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] border text-xs transition cursor-pointer tactile-btn whitespace-nowrap ${
            muteWords.length
              ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium"
              : "bg-[var(--card)] border-[var(--border-subtle)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)]"
          }`}
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>بی‌صدا</span>
          {muteWords.length > 0 && <span className="tabular-nums">· {muteWords.length.toLocaleString("fa-IR")}</span>}
        </button>

        {hasActive && (
          <div className="flex items-center gap-1.5 shrink-0 mr-auto pl-1">
            <span className="text-[11px] text-[var(--foreground-subtle)] tabular-nums whitespace-nowrap">
              {matchedTotal.toLocaleString("fa-IR")} از {articles.length.toLocaleString("fa-IR")} منطبق
            </span>
            <button
              type="button"
              onClick={copyShareLink}
              aria-label="کپی پیوند فیلتر"
              title="کپی لینک اشتراک‌گذاری"
              className="p-1 rounded-[var(--radius-xs)] hover:bg-[var(--background-muted)] text-[var(--foreground-subtle)] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--brand-600)]" /> : <Link2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClear}
              aria-label="پاک کردن موضوعات"
              title="پاک کردن"
              className="p-1 rounded-[var(--radius-xs)] hover:bg-[var(--background-muted)] text-[var(--foreground-subtle)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {muteOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16, ease: EASE_EDITORIAL }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-2 pt-0.5 flex items-center gap-1.5 flex-wrap">
              {muteWords.map((w) => (
                <span
                  key={w}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-xs)] text-[11px] bg-[var(--background-muted)] text-[var(--foreground)]"
                >
                  {w}
                  <button
                    type="button"
                    aria-label={`حذف واژه ${w}`}
                    onClick={() => onMuteChange(muteWords.filter((x) => x !== w))}
                    className="hover:text-[var(--destructive)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                value={muteInput}
                onChange={(e) => setMuteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMuteWord();
                  }
                }}
                placeholder="افزودن واژه برای بی‌صدا کردن…"
                className="flex-1 min-w-[160px] px-2.5 py-1 text-xs bg-[var(--card)] border border-[var(--border-subtle)] rounded-[var(--radius-xs)] outline-none focus:border-[var(--brand-500)]"
              />
              <button
                type="button"
                onClick={addMuteWord}
                aria-label="افزودن واژه"
                className="px-2 py-1 rounded-[var(--radius-xs)] text-xs bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center gap-1 cursor-pointer tactile-btn"
              >
                <Plus className="w-3 h-3" /> افزودن
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
