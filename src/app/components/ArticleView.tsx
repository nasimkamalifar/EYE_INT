import {
  Star, Bookmark, Share2, Link2, Printer, X, ExternalLink,
  Highlighter, Plus, Quote, Clock, Languages, Loader2, Maximize2, NotebookPen, BookOpen,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Article } from "../data";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { TagEditor } from "./TagEditor";
import { SentimentBadge } from "./SentimentBadge";
import {
  loadNotes, newNote, appendHighlight, getLastNoteId, setLastNoteId,
  quotesForArticle, type Note,
} from "../notes";
import type { TopicQuery } from "../timeline";
import type { DuplicateMatch } from "../duplicates";
import { api } from "../api";
import { studioUserId } from "./mobile/studio/studio";
import { extractFullContent, getFullContent, getArticleFa, setArticleFa } from "../translationCache";
import {
  SPRING_TACTILE, EASE_EDITORIAL, computeReadingScale,
} from "../motionChoreography";

type Props = {
  article: Article | null;
  onClose: () => void;
  toggleStar: (id: string) => void;
  toggleSave?: (id: string) => void;
  isSaved?: boolean;
  onTagsChange?: (id: string, tags: string[]) => void;
  related?: { article: Article; score: number }[];
  duplicates?: DuplicateMatch[];
  onSelectRelated?: (id: string) => void;
  onOpenTimeline?: (topic: TopicQuery) => void;
  onOpenReadingMode?: () => void;
  onOpenNotes?: () => void;
};

export function ArticleView({
  article,
  onClose,
  toggleStar,
  toggleSave,
  isSaved,
  onTagsChange,
  related,
  duplicates,
  onSelectRelated,
  onOpenTimeline,
  onOpenReadingMode,
  onOpenNotes,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [progressScale, setProgressScale] = useState(0);
  const [hl, setHl] = useState<{ x: number; y: number; quote: string } | null>(null);
  const [picker, setPicker] = useState<{ quote: string } | null>(null);
  const [quoteTick, setQuoteTick] = useState(0);
  const quotes = useMemo(() => (article ? quotesForArticle(article.id) : []), [article?.id, quoteTick]);

  // On-demand full-article translation to Persian (title + body), toggleable.
  const [trans, setTrans] = useState<{ title: string; content: string } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [transFromCache, setTransFromCache] = useState(false);
  useEffect(() => {
    setTrans(null);
    setTranslating(false);
    setShowOriginal(false);
    setTransFromCache(false);
  }, [article?.id]);

  // Full-text extraction
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [fullError, setFullError] = useState(false);
  const baseContent = fullContent ?? (article?.content || "");

  const loadFull = async () => {
    if (!article?.link || loadingFull) return;
    setLoadingFull(true);
    setFullError(false);
    const content = await extractFullContent(article.link);
    if (content && content.length > (article.content?.length || 0)) {
      setFullContent(content);
      setTrans(null);
    } else if (!article.content?.trim()) {
      setFullError(true);
    }
    setLoadingFull(false);
  };

  useEffect(() => {
    setFullContent(null);
    setLoadingFull(false);
    setFullError(false);
    if (!article?.link) return;
    const cached = getFullContent(article.link);
    if (cached && cached.length > (article.content?.length || 0)) {
      setFullContent(cached);
      return;
    }
    const short = (article.content?.trim().length || 0) < 600;
    if (short) {
      let cancelled = false;
      (async () => {
        setLoadingFull(true);
        const content = await extractFullContent(article.link!);
        if (cancelled) return;
        if (content && content.length > (article.content?.length || 0)) setFullContent(content);
        else if (!article.content?.trim()) setFullError(true);
        setLoadingFull(false);
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [article?.id]);

  const translateArticle = async () => {
    if (!article || translating) return;
    if (trans) {
      setShowOriginal((v) => !v);
      return;
    }
    const cached = getArticleFa(article.id);
    if (cached && cached.content) {
      setTrans(cached);
      setTransFromCache(true);
      setShowOriginal(false);
      return;
    }
    setTranslating(true);
    try {
      const paras = baseContent.split("\n\n");
      const texts = [article.title, ...paras];
      const out: string[] = [];
      for (let i = 0; i < texts.length; i += 20) {
        const chunk = texts.slice(i, i + 20);
        const r = await api.aiTranslateBatch({ texts: chunk, to: "fa" }, studioUserId());
        chunk.forEach((t, j) => out.push(r[j]?.trim() || t));
      }
      const value = { title: out[0] || article.title, content: out.slice(1).join("\n\n") };
      setArticleFa(article.id, value);
      setTrans(value);
      setTransFromCache(false);
      setShowOriginal(false);
    } catch (e) {
      console.log("article translation failed:", e);
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setProgressScale(computeReadingScale(el.scrollTop, el.scrollHeight, el.clientHeight));
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [article?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setHl(null);
    setPicker(null);
  }, [article?.id]);

  useEffect(() => {
    const onUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setHl(null);
        return;
      }
      const text = sel.toString().trim();
      if (text.length < 4) {
        setHl(null);
        return;
      }
      const root = contentRef.current;
      if (!root) return;
      const anchor = sel.anchorNode;
      const node = anchor?.nodeType === 1 ? (anchor as Node) : anchor?.parentNode;
      if (!node || !root.contains(node)) {
        setHl(null);
        return;
      }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const sr = scrollRef.current?.getBoundingClientRect();
      if (!sr) return;
      setHl({ x: r.left + r.width / 2 - sr.left, y: r.top - sr.top - 8, quote: text });
    };
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
    };
  }, [article?.id]);

  const quickHighlight = () => {
    if (!hl || !article) return;
    const last = getLastNoteId();
    const all = loadNotes();
    const target = (last && all.find((n) => n.id === last)) || all[0];
    if (target) {
      appendHighlight(target.id, hl.quote, article.title, article.id);
      setLastNoteId(target.id);
      setHl(null);
      setQuoteTick((t) => t + 1);
      window.getSelection()?.removeAllRanges();
      toast.success("نقل‌قول در یادداشت ذخیره شد");
    } else {
      setPicker({ quote: hl.quote });
      setHl(null);
    }
  };

  const pickHighlight = (noteId: string) => {
    if (!picker || !article) return;
    appendHighlight(noteId, picker.quote, article.title, article.id);
    setLastNoteId(noteId);
    setPicker(null);
    setQuoteTick((t) => t + 1);
    window.getSelection()?.removeAllRanges();
    toast.success("نقل‌قول به یادداشت افزوده شد");
  };

  const createAndAttach = () => {
    if (!picker || !article) return;
    const n = newNote(`نقل‌قول‌های «${article.title.slice(0, 40)}»`);
    appendHighlight(n.id, picker.quote, article.title, article.id);
    setLastNoteId(n.id);
    setPicker(null);
    setQuoteTick((t) => t + 1);
    window.getSelection()?.removeAllRanges();
    toast.success("یادداشت تازه ساخته و ذخیره شد");
  };

  const copyLink = async () => {
    const targetUrl = article?.link || window.location.href;
    try {
      await navigator.clipboard.writeText(targetUrl);
      toast.success("پیوند مقاله کپی شد");
    } catch {
      toast("کپی پیوند ناموفق بود");
    }
  };

  const shareArticle = async () => {
    if (!article) return;
    const url = article.link || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url });
        return;
      } catch {
        // fallback to copy
      }
    }
    await copyLink();
  };

  if (!article) {
    return (
      <aside className="flex-1 min-w-0 bg-[var(--background-subtle)] border-r border-[var(--border-subtle)] flex flex-col items-center justify-center p-10 text-center select-none">
        <div className="size-12 rounded-2xl bg-[var(--background-muted)] grid place-items-center mb-3 text-[var(--foreground-subtle)]">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="font-display text-lg font-medium text-[var(--foreground)] mb-1">
          مقاله‌ای برای مطالعه انتخاب کنید
        </div>
        <p className="text-xs text-[var(--foreground-subtle)] max-w-xs leading-relaxed">
          از کلیدهای <kbd className="font-mono px-1.5 py-0.5 rounded bg-[var(--background-muted)]">J</kbd> و{" "}
          <kbd className="font-mono px-1.5 py-0.5 rounded bg-[var(--background-muted)]">K</kbd> برای پیمایش سریع میان خبرها استفاده کنید.
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-[480px] xl:w-[560px] shrink-0 bg-[var(--background)] border-r border-[var(--border-subtle)] flex flex-col h-full relative overflow-hidden">
      {/* GPU Compositor Reading Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--border-subtle)]/60 z-20 overflow-hidden">
        <div
          className="h-full w-full bg-[var(--brand-500)] origin-right transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progressScale})` }}
        />
      </div>

      {/* Clean Curatorial Action Toolbar */}
      <div className="shrink-0 border-b border-[var(--border-subtle)] px-4 py-2.5 flex items-center gap-1 glass z-10">
        <motion.button
          type="button"
          whileTap={{ scale: 0.8 }}
          transition={SPRING_TACTILE}
          onClick={() => toggleStar(article.id)}
          aria-label={article.starred ? "حذف نشان" : "نشان‌دار کردن"}
          title={article.starred ? "حذف نشان (s)" : "نشان‌دار کردن (s)"}
          className="p-2 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-amber-500 hover:bg-[var(--background-muted)] transition-colors cursor-pointer"
        >
          <Star className={`w-4 h-4 ${article.starred ? "fill-amber-400 text-amber-400" : ""}`} />
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.8 }}
          transition={SPRING_TACTILE}
          onClick={() => toggleSave?.(article.id)}
          aria-label={isSaved ? "حذف از ذخیره‌شده‌ها" : "ذخیره برای مطالعه بعدی"}
          title={isSaved ? "حذف از ذخیره" : "ذخیره برای بعد"}
          className="p-2 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--brand-600)] hover:bg-[var(--background-muted)] transition-colors cursor-pointer"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-[var(--brand-500)] text-[var(--brand-500)]" : ""}`} />
        </motion.button>

        <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

        {onOpenReadingMode && (
          <button
            type="button"
            onClick={onOpenReadingMode}
            aria-label="حالت مطالعه متمرکز"
            title="حالت مطالعه متمرکز (f)"
            className="px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] inline-flex items-center gap-1.5 transition-colors cursor-pointer tactile-btn whitespace-nowrap"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">تمرکز</span>
          </button>
        )}

        <button
          type="button"
          onClick={translateArticle}
          disabled={translating}
          aria-label={trans ? (showOriginal ? "نمایش ترجمهٔ فارسی" : "نمایش متن اصلی") : "ترجمهٔ کامل خبر به فارسی"}
          title={trans ? (showOriginal ? "نمایش ترجمهٔ فارسی" : "نمایش متن اصلی") : "ترجمهٔ کامل خبر به فارسی"}
          className={`p-2 rounded-[var(--radius-sm)] disabled:opacity-50 cursor-pointer tactile-btn ${
            trans && !showOriginal
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]"
          }`}
        >
          {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={copyLink}
          aria-label="کپی پیوند مقاله"
          title="کپی پیوند"
          className="p-2 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] cursor-pointer tactile-btn"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={shareArticle}
          aria-label="اشتراک‌گذاری مقاله"
          title="اشتراک‌گذاری"
          className="p-2 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] cursor-pointer tactile-btn"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          aria-label="چاپ مقاله"
          title="چاپ"
          className="p-2 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] cursor-pointer tactile-btn"
        >
          <Printer className="w-4 h-4" />
        </button>

        {article.link && (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="مشاهده در منبع اصلی"
            title="مشاهده مقاله اصلی (v)"
            className="p-2 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] transition-colors tactile-btn"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={onClose}
          aria-label="بستن پنل مطالعه"
          title="بستن (Esc)"
          className="p-2 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] cursor-pointer tactile-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Monograph Body */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto relative">
        <AnimatePresence>
          {hl && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={SPRING_TACTILE}
              onClick={quickHighlight}
              style={{ left: Math.max(72, Math.min(hl.x, 380)), top: Math.max(8, hl.y) }}
              className="absolute z-30 -translate-x-1/2 -translate-y-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs px-3 py-1.5 rounded-[var(--radius-sm)] shadow-[var(--shadow-lg)] flex items-center gap-1.5 cursor-pointer"
            >
              <Highlighter className="w-3.5 h-3.5" /> ذخیره در یادداشت
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {picker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4"
              onClick={() => setPicker(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 6 }}
                transition={{ duration: 0.16, ease: EASE_EDITORIAL }}
                onClick={(e) => e.stopPropagation()}
                className="w-80 max-h-[70%] bg-[var(--popover)] text-[var(--popover-foreground)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] flex flex-col overflow-hidden border border-[var(--border)]"
              >
                <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] text-xs font-semibold">
                  انتخاب یادداشت مقصد
                </div>
                <div className="p-3 text-xs text-[var(--foreground-muted)] border-b border-[var(--border-subtle)] line-clamp-3 italic">
                  «{picker.quote}»
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadNotes()
                    .sort((a: Note, b: Note) => b.updatedAt - a.updatedAt)
                    .map((n: Note) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => pickHighlight(n.id)}
                        className="w-full text-right px-4 py-2.5 hover:bg-[var(--background-muted)] border-b border-[var(--border-subtle)] text-xs truncate cursor-pointer"
                      >
                        {n.title || "بدون عنوان"}
                      </button>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={createAndAttach}
                  className="px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> ساخت یادداشت جدید
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE_EDITORIAL }}
            className="max-w-2xl mx-auto w-full px-7 py-7"
          >
            {/* Source & Author Kicker */}
            <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)] mb-3">
              <span className="text-base leading-none">{article.sourceIcon}</span>
              {onOpenTimeline ? (
                <button
                  type="button"
                  onClick={() => onOpenTimeline({ kind: "source", source: article.source })}
                  className="font-semibold text-[var(--foreground-muted)] hover:text-[var(--brand-600)] inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="مشاهده خط زمانی این رسانه"
                >
                  {article.source}
                  <Clock className="w-3 h-3 opacity-70" />
                </button>
              ) : (
                <span className="font-semibold text-[var(--foreground-muted)]">{article.source}</span>
              )}
              {article.author && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{article.author}</span>
                </>
              )}
            </div>

            {/* Editorial Display Headline */}
            <h1 className="font-display text-[25px] lg:text-[28px] font-semibold leading-[1.45] tracking-tight text-[var(--foreground)] headline-balance mb-3.5">
              {trans && !showOriginal ? trans.title : article.title}
            </h1>

            {/* Clean Unboxed Metadata Line */}
            <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)] mb-5 flex-wrap tabular-nums">
              <span>{article.date}</span>
              {article.readTime && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{article.readTime} مطالعه</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <SentimentBadge article={article} size="sm" />
              {article.link && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--brand-600)] dark:text-[var(--brand-400)] hover:underline font-medium"
                  >
                    منبع اصلی <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>

            <div className="mb-6 pb-4 border-b border-[var(--border-subtle)]">
              <TagEditor
                tags={article.tags || []}
                onChange={(t) => onTagsChange?.(article.id, t)}
              />
            </div>

            {article.image && (
              <figure className="mb-6 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--background-muted)] border border-[var(--border-subtle)]">
                <ImageWithFallback
                  src={article.image}
                  alt={article.title}
                  className="w-full aspect-[16/10] object-cover"
                />
              </figure>
            )}

            {trans && (
              <div className="mb-4 text-xs text-[var(--brand-700)] dark:text-[var(--brand-300)] flex items-center gap-2 py-2 px-3 rounded-[var(--radius-sm)] bg-[var(--accent)]/60">
                <Languages className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">
                  {showOriginal ? "در حال نمایش متن اصلی" : "ترجمه‌شده به فارسی"}
                  {!showOriginal && transFromCache && " · از حافظه"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  className="underline font-medium cursor-pointer"
                >
                  {showOriginal ? "نمایش ترجمه" : "نمایش متن اصلی"}
                </button>
              </div>
            )}

            {/* Optimal Reading Column Body */}
            <div
              ref={contentRef}
              className="text-[15.5px] leading-[1.95] text-[var(--foreground)] space-y-4 max-w-prose"
            >
              {(trans && !showOriginal ? trans.content : baseContent)
                .split("\n\n")
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}

              {loadingFull && (
                <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)] pt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> در حال بارگذاری متن کامل خبر…
                </div>
              )}
              {!loadingFull && fullError && article.link && (
                <div className="pt-2 text-xs text-[var(--foreground-subtle)]">
                  امکان استخراج خودکار متن کامل نبود.{" "}
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--brand-600)] dark:text-[var(--brand-400)] hover:underline font-medium"
                  >
                    مطالعهٔ خبر در منبع اصلی
                  </a>
                </div>
              )}
              {!loadingFull && !fullContent && !fullError && article.link && baseContent.trim().length >= 600 && (
                <button
                  type="button"
                  onClick={loadFull}
                  className="pt-2 text-xs text-[var(--brand-600)] dark:text-[var(--brand-400)] hover:underline font-medium cursor-pointer"
                >
                  بارگذاری متن کامل خبر
                </button>
              )}
            </div>

            {/* Cross-Outlet Duplicate Coverage */}
            {duplicates && duplicates.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
                <div className="text-xs font-semibold text-[var(--foreground)] mb-3">
                  پوشش مشابه در سایر رسانه‌ها ({duplicates.length.toLocaleString("fa-IR")})
                </div>
                <div className="space-y-1.5">
                  {duplicates.slice(0, 4).map((d) => (
                    <button
                      key={d.article.id}
                      type="button"
                      onClick={() => onSelectRelated?.(d.article.id)}
                      className="w-full text-right p-2.5 rounded-[var(--radius-sm)] bg-[var(--background-subtle)] hover:bg-[var(--background-muted)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                    >
                      <div className="text-[11px] text-[var(--foreground-subtle)] mb-0.5 tabular-nums">
                        {d.article.sourceIcon} {d.article.source} · {Math.round(d.similarity * 100).toLocaleString("fa-IR")}٪ تشابه
                      </div>
                      <div className="text-xs font-medium text-[var(--foreground)] truncate">{d.article.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Quotes */}
            {quotes.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
                <div className="text-xs font-semibold text-[var(--foreground)] mb-3 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                  نقل‌قول‌های ذخیره‌شده
                </div>
                <div className="space-y-3">
                  {quotes.map(({ note, quotes: qs }) => (
                    <div
                      key={note.id}
                      className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--background-subtle)] p-3.5"
                    >
                      <div className="text-[11px] text-[var(--foreground-subtle)] mb-2">
                        یادداشت: {note.title || "بدون عنوان"}
                      </div>
                      <div className="space-y-2 divide-y divide-[var(--border-subtle)]">
                        {qs.map((q, i) => (
                          <blockquote
                            key={i}
                            className={`text-sm italic text-[var(--foreground)] leading-relaxed ${i > 0 ? "pt-2" : ""}`}
                          >
                            «{q}»
                          </blockquote>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {related && related.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
                <div className="text-xs font-semibold text-[var(--foreground)] mb-3">
                  مقالات مرتبط
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {related.slice(0, 6).map((r) => (
                    <button
                      key={r.article.id}
                      type="button"
                      onClick={() => onSelectRelated?.(r.article.id)}
                      className="text-right p-3 rounded-[var(--radius-md)] bg-[var(--background-subtle)] hover:bg-[var(--background-muted)] border border-[var(--border-subtle)] transition-colors cursor-pointer tactile-btn"
                    >
                      <div className="text-[11px] text-[var(--foreground-subtle)] mb-1 tabular-nums">
                        {r.article.source} · {Math.round(r.score * 100).toLocaleString("fa-IR")}٪ مرتبط
                      </div>
                      <div className="text-xs font-medium text-[var(--foreground)] line-clamp-2 leading-relaxed">
                        {r.article.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wired Editorial Footer Actions */}
            <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex items-center flex-wrap gap-2">
              {onOpenNotes && (
                <button
                  type="button"
                  onClick={onOpenNotes}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[var(--background-subtle)] hover:bg-[var(--background-muted)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-xs font-medium text-[var(--foreground)] transition-colors cursor-pointer tactile-btn"
                >
                  <NotebookPen className="w-3.5 h-3.5" /> یادداشت درباره این خبر
                </button>
              )}
              {onOpenReadingMode && (
                <button
                  type="button"
                  onClick={onOpenReadingMode}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[var(--background-subtle)] hover:bg-[var(--background-muted)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-xs font-medium text-[var(--foreground)] transition-colors cursor-pointer tactile-btn"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> مطالعه تمام‌صفحه
                </button>
              )}
              <button
                type="button"
                onClick={shareArticle}
                className="flex items-center gap-2 px-3.5 py-2 bg-[var(--background-subtle)] hover:bg-[var(--background-muted)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-xs font-medium text-[var(--foreground)] transition-colors cursor-pointer tactile-btn"
              >
                <Share2 className="w-3.5 h-3.5" /> اشتراک‌گذاری
              </button>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </aside>
  );
}
