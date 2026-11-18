import {
  Search, Rss, FileText, Star, Circle, Settings, Plus, TrendingUp, Bookmark, Tag,
  FileUp, ChevronDown, RefreshCw, AlertTriangle, Trash2, Network, Globe2,
  BarChart3, Sunrise, Command, Sparkles, Filter, Brain, NotebookPen, Clock, Pin, X,
  Wand2, Radar, Package, MonitorDot, Crosshair, Workflow, Columns3, PanelRightClose,
  PanelRightOpen, HelpCircle, Languages, CopyMinus,
} from "lucide-react";
import { useMemo, useState, type PointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ThemeToggle } from "./ThemeToggle";
import { type Topic, topicColorClasses } from "../topics";
import {
  useAutoTranslateTitles, getAutoTranslate, setAutoTranslate,
  useDedupeArticles, getDedupe, setDedupe,
} from "../translationCache";
import {
  SPRING_SNAPPY, SPRING_SILK, SPRING_TACTILE, EASE_EDITORIAL, computeSpotlightCoords,
} from "../motionChoreography";

export type SidebarFeed = { id: string; name: string; count: number; icon: string; category: string };
export type PinnedTopic = { topic: Topic; count: number; active: boolean };

type Props = {
  activeView: string;
  setActiveView: (v: string) => void;
  selectedFeed: string | null;
  setSelectedFeed: (id: string | null) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  feeds: SidebarFeed[];
  onAddFeed: () => void;
  onRefresh: () => void;
  loading: boolean;
  totals: { all: number; unread: number; starred: number; saved: number };
  search: string;
  setSearch: (s: string) => void;
  lastRefresh: Date | null;
  feedStatus?: Record<string, { ok: boolean; error?: string }>;
  onOpenOpml?: () => void;
  onRemoveFeed?: (id: string) => void;
  onPruneFeeds?: () => void;
  pruning?: boolean;
  onOpenStats?: () => void;
  onOpenDigest?: () => void;
  onOpenPalette?: () => void;
  onOpenSourceHub?: () => void;
  onOpenSavedSearches?: () => void;
  onOpenKnowledge?: () => void;
  onOpenNotes?: () => void;
  onOpenTimeline?: () => void;
  onOpenStudio?: () => void;
  onOpenVisualFlow?: () => void;
  pinnedTopics?: PinnedTopic[];
  onToggleTopic?: (id: string) => void;
  onClearTopics?: () => void;
  onAddTopic?: () => void;
  socialUnread?: number;
  watchUnread?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  activeWorkspaceTab?: "reader" | "editorial" | "visual_flow" | "graph";
};

function handleSpotlightMove(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const { x, y } = computeSpotlightCoords(e.clientX, e.clientY, rect);
  el.style.setProperty("--spot-x", `${x}px`);
  el.style.setProperty("--spot-y", `${y}px`);
}

export function Sidebar({
  activeView, setActiveView, selectedFeed, setSelectedFeed,
  selectedCategory = null, setSelectedCategory = () => {},
  theme, onToggleTheme, feeds, onAddFeed, onRefresh, loading,
  totals = { all: 0, unread: 0, starred: 0, saved: 0 },
  search = "", setSearch = () => {}, lastRefresh = null,
  feedStatus = {}, onOpenOpml = () => {}, onRemoveFeed, onPruneFeeds, pruning = false, onOpenHelp, onOpenRules,
  onOpenStats, onOpenDigest, onOpenPalette, onOpenSourceHub, onOpenSavedSearches, onOpenKnowledge, onOpenNotes, onOpenTimeline, onOpenStudio, onOpenVisualFlow,
  pinnedTopics = [], onToggleTopic, onClearTopics, onAddTopic, socialUnread = 0, watchUnread = 0,
  collapsed: controlledCollapsed, onToggleCollapse, activeWorkspaceTab,
}: Props & { onOpenHelp?: () => void; onOpenRules?: () => void }) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const handleToggleCollapse = () => {
    if (onToggleCollapse) onToggleCollapse();
    else setInternalCollapsed((v) => !v);
  };
  const [feedsOpen, setFeedsOpen] = useState(true);
  const [catsOpen, setCatsOpen] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const autoTranslate = useAutoTranslateTitles();
  const dedupe = useDedupeArticles();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const navGroups = [
    {
      id: "reading",
      label: "خواندن",
      icon: FileText,
      items: [
        { id: "all", label: "همه مقالات", icon: FileText, count: totals.all },
        { id: "unread", label: "خوانده نشده", icon: Circle, count: totals.unread },
        { id: "starred", label: "نشان شده‌ها", icon: Star, count: totals.starred },
        { id: "saved", label: "ذخیره شده‌ها", icon: Bookmark, count: totals.saved },
      ],
    },
    {
      id: "discover",
      label: "کشف و رصد",
      icon: Radar,
      items: [
        { id: "trending", label: "پرطرفدارها", icon: TrendingUp, count: null },
        { id: "tags", label: "برچسب‌ها", icon: Tag, count: null },
        { id: "international", label: "اخبار بین‌الملل", icon: Globe2, count: null },
        { id: "graph", label: "نقشهٔ رسانه‌ای", icon: Network, count: null },
        { id: "room", label: "اتاق رصد رسانه‌ای", icon: MonitorDot, count: null },
        { id: "social", label: "رصد اجتماعی", icon: Radar, count: null, badge: socialUnread || null },
        { id: "watch", label: "رصد تغییرات صفحه", icon: Crosshair, count: null, badge: watchUnread || null },
      ],
    },
    {
      id: "tools",
      label: "ابزارها",
      icon: Wand2,
      items: [
        { id: "visual-flow", label: "بوم بصری اتوماسیون", icon: Workflow, count: null, action: onOpenVisualFlow || onOpenStudio },
        { id: "studio", label: "استودیوی محتوا (۳ستونه)", icon: Columns3, count: null, action: onOpenStudio },
        { id: "newspack", label: "بسته‌های خبری سفارشی", icon: Package, count: null },
        { id: "digest", label: "گزارش روزانه", icon: Sunrise, count: null, action: onOpenDigest },
        { id: "stats", label: "داشبورد آمار", icon: BarChart3, count: null, action: onOpenStats },
        { id: "source-hub", label: "منبع‌یاب چندپلتفرمی", icon: Sparkles, count: null, action: onOpenSourceHub },
        { id: "saved-searches", label: "فیلترهای ذخیره‌شده", icon: Filter, count: null, action: onOpenSavedSearches },
        { id: "knowledge", label: "موتور دانش", icon: Brain, count: null, action: onOpenKnowledge },
        { id: "notes", label: "یادداشت‌ها", icon: NotebookPen, count: null, action: onOpenNotes },
        { id: "timeline", label: "خط زمانی موضوع", icon: Clock, count: null, action: onOpenTimeline },
      ],
    },
  ];

  const grouped = useMemo(() => {
    const m = new Map<string, SidebarFeed[]>();
    for (const f of feeds) {
      const k = f.category || "سایر";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(f);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [feeds]);

  const catColor = (name: string) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    return `hsl(${hue} 65% 48%)`;
  };

  const toggleCat = (name: string) => {
    const next = new Set(expandedCats);
    next.has(name) ? next.delete(name) : next.add(name);
    setExpandedCats(next);
  };

  return (
    <aside
      data-testid="app-sidebar"
      data-collapsed={isCollapsed ? "true" : "false"}
      className={`${
        isCollapsed ? "w-[68px]" : "w-[276px] max-w-[85vw]"
      } shrink-0 bg-[var(--background-subtle)] border-l border-[var(--border-subtle)] flex flex-col h-full transition-[width] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-x-hidden select-none`}
    >
      {/* Top Brand + Search Zone */}
      <div className={`${isCollapsed ? "p-2.5 space-y-2.5 flex flex-col items-center" : "p-4"} border-b border-[var(--border-subtle)]`}>
        {isCollapsed ? (
          <>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={SPRING_TACTILE}
              onClick={handleToggleCollapse}
              data-testid="sidebar-collapse-toggle"
              aria-expanded={false}
              aria-label="باز کردن نوار کناری"
              title="باز کردن نوار کناری"
              className="size-9 grid place-items-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--card)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <PanelRightOpen className="w-4 h-4" />
            </motion.button>
            <div
              title="کیان (Flow)"
              className="size-9 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-bold shadow-[var(--shadow-xs)]"
            >
              ک
            </div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={() => handleToggleCollapse()}
              aria-label="جستجو در مقالات"
              title="جستجو در مقالات (باز کردن نوار کناری)"
              className="size-9 grid place-items-center rounded-[var(--radius-md)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer tactile-btn"
            >
              <Search className="w-4 h-4" />
            </button>
            {onOpenPalette && (
              <button
                type="button"
                onClick={onOpenPalette}
                aria-label="پنل دستورات"
                title="پنل دستورات (Ctrl K)"
                className="size-9 grid place-items-center rounded-[var(--radius-md)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer tactile-btn"
              >
                <Command className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[22px] font-semibold tracking-tight text-[var(--foreground)] leading-none">
                  FLOW
                </span>
                <span className="text-[11px] text-[var(--foreground-subtle)] font-medium">
                  کیان
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((o) => !o)}
                    aria-label="تنظیمات"
                    aria-expanded={settingsOpen}
                    title="تنظیمات"
                    className={`size-8 grid place-items-center rounded-[var(--radius-md)] transition-colors cursor-pointer tactile-btn ${
                      settingsOpen
                        ? "bg-[var(--background-muted)] text-[var(--foreground)]"
                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {settingsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -4 }}
                          transition={{ duration: 0.16, ease: EASE_EDITORIAL }}
                          className="absolute left-0 top-full mt-2 z-50 w-72 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] shadow-[var(--shadow-xl)] p-3 origin-top-left"
                          dir="rtl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[var(--foreground)]">تنظیمات خواندن</span>
                            <button
                              type="button"
                              onClick={() => setSettingsOpen(false)}
                              aria-label="بستن تنظیمات"
                              className="p-1 rounded-[var(--radius-xs)] hover:bg-[var(--background-muted)] text-[var(--foreground-subtle)]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => setAutoTranslate(!getAutoTranslate())}
                              className="w-full flex items-center gap-3 p-2 rounded-[var(--radius-md)] hover:bg-[var(--background-muted)] text-right transition-colors cursor-pointer"
                            >
                              <span className="shrink-0 size-8 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-foreground)] grid place-items-center">
                                <Languages className="w-4 h-4" />
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-xs font-medium text-[var(--foreground)]">ترجمهٔ خودکار تیترها</span>
                                <span className="block text-[11px] text-[var(--foreground-subtle)] leading-tight mt-0.5">نمایش خودکار تیترهای غیرفارسی به فارسی</span>
                              </span>
                              <span className={`shrink-0 w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${autoTranslate ? "bg-[var(--brand-500)] justify-end" : "bg-[var(--border)] justify-start"}`}>
                                <motion.span layout transition={SPRING_SNAPPY} className="size-4 rounded-full bg-white shadow-xs" />
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDedupe(!getDedupe())}
                              className="w-full flex items-center gap-3 p-2 rounded-[var(--radius-md)] hover:bg-[var(--background-muted)] text-right transition-colors cursor-pointer"
                            >
                              <span className="shrink-0 size-8 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-foreground)] grid place-items-center">
                                <CopyMinus className="w-4 h-4" />
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-xs font-medium text-[var(--foreground)]">ادغام اخبار تکراری</span>
                                <span className="block text-[11px] text-[var(--foreground-subtle)] leading-tight mt-0.5">حذف تیترهای مشابه از خروجی فیدها</span>
                              </span>
                              <span className={`shrink-0 w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${dedupe ? "bg-[var(--brand-500)] justify-end" : "bg-[var(--border)] justify-start"}`}>
                                <motion.span layout transition={SPRING_SNAPPY} className="size-4 rounded-full bg-white shadow-xs" />
                              </span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  transition={SPRING_TACTILE}
                  onClick={handleToggleCollapse}
                  data-testid="sidebar-collapse-toggle"
                  aria-expanded={true}
                  aria-label="جمع کردن نوار کناری"
                  title="جمع کردن نوار کناری"
                  className="hidden md:grid size-8 place-items-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--card)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  <PanelRightClose className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground-subtle)] group-focus-within:text-[var(--brand-600)] transition-colors pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                data-search-input
                aria-label="جستجو در مقالات"
                placeholder="جستجو در مقالات… ( / )"
                className="w-full bg-[var(--card)] border border-[var(--border-subtle)] focus:border-[var(--brand-500)] rounded-[var(--radius-md)] py-2 pr-9 pl-7 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="پاک کردن جستجو"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {onOpenPalette && (
              <button
                type="button"
                onClick={onOpenPalette}
                className="mt-2 w-full flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--card)]/70 border border-[var(--border-subtle)] hover:border-[var(--border)] text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer tactile-btn"
              >
                <Command className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
                <span className="flex-1 text-right">پنل دستورات</span>
                <kbd className="text-[10px] font-mono text-[var(--foreground-subtle)] bg-[var(--background-muted)] rounded px-1.5 py-0.5">
                  Ctrl K
                </kbd>
              </button>
            )}
          </>
        )}
      </div>

      {/* Scrollable Navigation & Feeds */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? "p-2 space-y-2" : "px-3 py-3"}`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1.5 pb-2 border-b border-[var(--border-subtle)]">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={SPRING_TACTILE}
              onClick={() => onOpenStudio?.()}
              data-testid="sidebar-open-studio-workspace"
              aria-label="میز کار تحریریه"
              title="میز کار تحریریه (ویرایشگر متمرکز ۸ پلتفرم)"
              className={`size-10 grid place-items-center rounded-[var(--radius-md)] transition-colors cursor-pointer ${
                activeWorkspaceTab === "editorial"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-xs)]"
                  : "bg-[var(--card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:bg-[var(--background-muted)]"
              }`}
            >
              <Columns3 className="w-4 h-4" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={SPRING_TACTILE}
              onClick={() => (onOpenVisualFlow ? onOpenVisualFlow() : onOpenStudio?.())}
              data-testid="sidebar-open-visual-flow"
              aria-label="بوم بصری اتوماسیون"
              title="بوم بصری اتوماسیون"
              className={`size-10 grid place-items-center rounded-[var(--radius-md)] transition-colors cursor-pointer ${
                activeWorkspaceTab === "visual_flow"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border border-[var(--brand-400)]"
                  : "bg-[var(--card)] border border-[var(--border-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]"
              }`}
            >
              <Workflow className="w-4 h-4" />
            </motion.button>
          </div>
        ) : (
          <div className="mb-4 space-y-1.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.985 }}
              transition={SPRING_TACTILE}
              onPointerMove={handleSpotlightMove}
              onClick={() => onOpenStudio?.()}
              data-testid="sidebar-open-studio-workspace"
              className={`editorial-spotlight w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-right transition-all cursor-pointer ${
                activeWorkspaceTab === "editorial"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-sm)]"
                  : "bg-[var(--card)] hover:bg-[var(--background-muted)] text-[var(--foreground)] border border-[var(--border-subtle)]"
              }`}
            >
              <Columns3 className={`w-4 h-4 shrink-0 ${activeWorkspaceTab === "editorial" ? "" : "text-[var(--brand-600)]"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold leading-tight">میز کار تحریریه</div>
                <div className={`text-[10.5px] truncate mt-0.5 ${activeWorkspaceTab === "editorial" ? "opacity-80" : "text-[var(--foreground-subtle)]"}`}>
                  ویرایشگر متمرکز ۸ پلتفرم
                </div>
              </div>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.985 }}
              transition={SPRING_TACTILE}
              onPointerMove={handleSpotlightMove}
              onClick={() => (onOpenVisualFlow ? onOpenVisualFlow() : onOpenStudio?.())}
              data-testid="sidebar-open-visual-flow"
              className={`editorial-spotlight w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] border text-right transition-all cursor-pointer ${
                activeWorkspaceTab === "visual_flow"
                  ? "bg-[var(--accent)] border-[var(--brand-400)] text-[var(--accent-foreground)] shadow-[var(--shadow-xs)]"
                  : "bg-[var(--card)] hover:bg-[var(--background-muted)] text-[var(--foreground)] border-[var(--border-subtle)]"
              }`}
            >
              <Workflow className="w-4 h-4 shrink-0 text-[var(--brand-600)]" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold leading-tight">بوم بصری اتوماسیون</div>
                <div className="text-[10.5px] text-[var(--foreground-subtle)] truncate mt-0.5">
                  طراحی جریان انتشار هوشمند
                </div>
              </div>
            </motion.button>
          </div>
        )}

        {/* Primary Navigation Groups with Shared layoutId Active Pill */}
        <nav aria-label="ناوبری اصلی" className={isCollapsed ? "flex flex-col items-center gap-1" : "mb-5 space-y-3.5"}>
          {navGroups.map((group, gIdx) => {
            const collapsed = collapsedGroups.has(group.id);
            const groupBadge = group.items.reduce((s, it) => s + (Number((it as any).badge) || 0), 0);

            if (isCollapsed) {
              return (
                <div
                  key={group.id}
                  className={`w-full flex flex-col items-center gap-1 ${
                    gIdx > 0 ? "pt-2 mt-1 border-t border-[var(--border-subtle)]" : ""
                  }`}
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      (item.id === "studio" && activeWorkspaceTab === "editorial") ||
                      (item.id === "visual-flow" && activeWorkspaceTab === "visual_flow") ||
                      (item.id === "graph" && activeWorkspaceTab === "graph") ||
                      ((!activeWorkspaceTab || activeWorkspaceTab === "reader") && activeView === item.id);
                    const badge = (item as any).badge;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        title={item.count !== null && item.count !== undefined ? `${item.label} (${item.count})` : item.label}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          if ((item as any).action) { (item as any).action(); return; }
                          setActiveView(item.id); setSelectedFeed(null); setSelectedCategory(null);
                        }}
                        className={`relative size-10 grid place-items-center rounded-[var(--radius-md)] transition-colors cursor-pointer tactile-btn ${
                          active
                            ? "text-[var(--accent-foreground)]"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-collapsed-active-pill"
                            transition={SPRING_SNAPPY}
                            className="absolute inset-0 rounded-[var(--radius-md)] bg-[var(--accent)]"
                          />
                        )}
                        <Icon className="relative z-10 w-4 h-4" />
                        {badge ? (
                          <span className="absolute top-1.5 left-1.5 z-10 size-2 rounded-full bg-[var(--destructive)]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!collapsed}
                  className="w-full flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? "rotate-90" : "rotate-0"}`}
                  />
                  <span className="flex-1 text-right text-[11px] font-semibold">
                    {group.label}
                  </span>
                  {collapsed && groupBadge > 0 && (
                    <span className="text-[11px] font-semibold text-[var(--destructive)] tabular-nums">
                      {groupBadge.toLocaleString("fa-IR")}
                    </span>
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: EASE_EDITORIAL }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 pt-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active =
                            (item.id === "studio" && activeWorkspaceTab === "editorial") ||
                            (item.id === "visual-flow" && activeWorkspaceTab === "visual_flow") ||
                            (item.id === "graph" && activeWorkspaceTab === "graph") ||
                            ((!activeWorkspaceTab || activeWorkspaceTab === "reader") && activeView === item.id);
                          const badge = (item as any).badge;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              aria-current={active ? "page" : undefined}
                              onClick={() => {
                                if ((item as any).action) { (item as any).action(); return; }
                                setActiveView(item.id); setSelectedFeed(null); setSelectedCategory(null);
                              }}
                              className={`relative w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-right transition-colors cursor-pointer ${
                                active
                                  ? "text-[var(--accent-foreground)] font-semibold"
                                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]/70"
                              }`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="sidebar-expanded-active-pill"
                                  transition={SPRING_SNAPPY}
                                  className="absolute inset-0 rounded-[var(--radius-sm)] bg-[var(--accent)]"
                                />
                              )}
                              <Icon className={`relative z-10 w-4 h-4 shrink-0 ${active ? "text-[var(--brand-700)] dark:text-[var(--ink-900)]" : ""}`} />
                              <span className="relative z-10 flex-1 text-[13px] truncate">{item.label}</span>
                              {item.count !== null && item.count !== undefined && item.count > 0 && (
                                <span className={`relative z-10 text-[11.5px] tabular-nums ${active ? "opacity-90" : "text-[var(--foreground-subtle)]"}`}>
                                  {item.count.toLocaleString("fa-IR")}
                                </span>
                              )}
                              {badge ? (
                                <span className="relative z-10 text-[11px] font-semibold text-[var(--destructive)] tabular-nums">
                                  {badge.toLocaleString("fa-IR")}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Pinned Topics */}
        {!isCollapsed && pinnedTopics.length > 0 && (
          <div className="mb-4 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[var(--foreground-subtle)] text-[11px] font-semibold">
              <Pin className="w-3 h-3" />
              <span className="flex-1 text-right">موضوعات فعال</span>
              {pinnedTopics.some((p) => p.active) && onClearTopics && (
                <button
                  type="button"
                  onClick={onClearTopics}
                  aria-label="پاک کردن همه موضوعات"
                  title="پاک کردن همه"
                  className="p-0.5 hover:text-[var(--foreground)] rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {onAddTopic && (
                <button
                  type="button"
                  onClick={onAddTopic}
                  aria-label="افزودن موضوع سفارشی"
                  title="موضوع سفارشی"
                  className="p-0.5 hover:text-[var(--foreground)] rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-0.5 mt-1">
              {pinnedTopics.map(({ topic, count, active }) => {
                const cls = topicColorClasses(topic.color);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => onToggleTopic?.(topic.id)}
                    disabled={count === 0 && !active}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-right text-xs transition cursor-pointer ${
                      active
                        ? `${cls.chip} font-medium`
                        : count === 0
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-[var(--background-muted)]"
                    }`}
                  >
                    <span>{topic.icon}</span>
                    <span className="flex-1 truncate">{topic.name}</span>
                    <span className="text-[11px] tabular-nums opacity-75">
                      {count.toLocaleString("fa-IR")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories & Feeds */}
        {isCollapsed ? (
          <div className="pt-2 mt-2 border-t border-[var(--border-subtle)] flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleToggleCollapse}
              title={`همه خوراک‌ها (${feeds.length})`}
              aria-label="نمایش دسته‌بندی‌ها و خوراک‌ها"
              className="size-10 grid place-items-center rounded-[var(--radius-md)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] transition-colors cursor-pointer tactile-btn"
            >
              <Rss className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRefresh}
              title="بروزرسانی خوراک‌ها"
              aria-label="بروزرسانی خوراک‌ها"
              className="size-10 grid place-items-center rounded-[var(--radius-md)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] transition-colors cursor-pointer tactile-btn"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onAddFeed}
              title="افزودن خوراک"
              aria-label="افزودن خوراک"
              className="size-10 grid place-items-center rounded-[var(--radius-md)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] transition-colors cursor-pointer tactile-btn"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-4">
            {/* Categories */}
            <div>
              <button
                type="button"
                onClick={() => setCatsOpen(!catsOpen)}
                aria-expanded={catsOpen}
                className="w-full flex items-center gap-1.5 px-2 py-1 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] text-[11px] font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catsOpen ? "rotate-0" : "rotate-90"}`} />
                <span className="flex-1 text-right">دسته‌بندی‌ها</span>
                <span className="tabular-nums opacity-70">{grouped.length.toLocaleString("fa-IR")}</span>
              </button>
              <AnimatePresence initial={false}>
                {catsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: EASE_EDITORIAL }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 pt-1">
                      {grouped.map(([cat, list]) => {
                        const unread = list.reduce((s, f) => s + f.count, 0);
                        const expanded = expandedCats.has(cat);
                        const catActive = selectedCategory === cat && activeView === "category";
                        return (
                          <div key={cat}>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => toggleCat(cat)}
                                aria-label={`باز و بسته کردن دسته ${cat}`}
                                className="p-1 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] rounded cursor-pointer"
                              >
                                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${expanded ? "rotate-0" : "rotate-90"}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => { setActiveView("category"); setSelectedCategory(cat); setSelectedFeed(null); }}
                                className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-right text-[13px] transition-colors cursor-pointer ${
                                  catActive
                                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold"
                                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]/70"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColor(cat) }} />
                                <span className="flex-1 truncate">{cat}</span>
                                <span className="text-[11px] tabular-nums text-[var(--foreground-subtle)]">
                                  {(unread > 0 ? unread : list.length).toLocaleString("fa-IR")}
                                </span>
                              </button>
                            </div>
                            <AnimatePresence initial={false}>
                              {expanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={SPRING_SILK}
                                  className="mr-5 pr-2 border-r border-[var(--border-subtle)] space-y-0.5 mt-0.5 overflow-hidden"
                                >
                                  {list.map((feed) => {
                                    const st = feedStatus[feed.id];
                                    const broken = st && st.ok === false;
                                    const isSelected = selectedFeed === feed.id && activeView === "feed";
                                    return (
                                      <div key={feed.id} className="group flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => { setSelectedFeed(feed.id); setActiveView("feed"); setSelectedCategory(null); }}
                                          className={`flex-1 flex items-center gap-2 px-2 py-1 rounded-[var(--radius-xs)] text-right text-xs transition-colors cursor-pointer ${
                                            isSelected
                                              ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                                              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]"
                                          }`}
                                        >
                                          <span className="shrink-0">{feed.icon}</span>
                                          <span className={`flex-1 truncate ${broken ? "text-[var(--destructive)]" : ""}`}>{feed.name}</span>
                                          {broken && <AlertTriangle className="w-3 h-3 text-[var(--destructive)]" title={st.error || "خطا در دریافت"} />}
                                          {feed.count > 0 && <span className="tabular-nums text-[11px] text-[var(--foreground-subtle)]">{feed.count.toLocaleString("fa-IR")}</span>}
                                        </button>
                                        {onRemoveFeed && (
                                          <button
                                            type="button"
                                            onClick={() => onRemoveFeed(feed.id)}
                                            aria-label={`حذف خوراک ${feed.name}`}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--foreground-subtle)] hover:text-[var(--destructive)] transition-opacity"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* All Feeds */}
            <div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFeedsOpen(!feedsOpen)}
                  aria-expanded={feedsOpen}
                  className="flex-1 flex items-center gap-1.5 px-2 py-1 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] text-[11px] font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${feedsOpen ? "rotate-0" : "rotate-90"}`} />
                  <Rss className="w-3 h-3" />
                  <span className="flex-1 text-right">همه خوراک‌ها</span>
                  <span className="tabular-nums opacity-70">{feeds.length.toLocaleString("fa-IR")}</span>
                </button>
                <button
                  type="button"
                  onClick={onRefresh}
                  aria-label="بروزرسانی خوراک‌ها"
                  title="بروزرسانی"
                  className="p-1.5 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] rounded-[var(--radius-xs)] transition-colors cursor-pointer tactile-btn"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
                {onPruneFeeds && (
                  <button
                    type="button"
                    onClick={onPruneFeeds}
                    disabled={pruning}
                    aria-label="بررسی سلامت خوراک‌ها"
                    title="بررسی سلامت و حذف خوراک‌های خراب"
                    className="p-1.5 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] rounded-[var(--radius-xs)] disabled:opacity-50 transition-colors cursor-pointer tactile-btn"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${pruning ? "animate-spin text-[var(--brand-500)]" : ""}`} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAddFeed}
                  aria-label="افزودن خوراک جدید"
                  title="افزودن خوراک"
                  className="p-1.5 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] rounded-[var(--radius-xs)] transition-colors cursor-pointer tactile-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <AnimatePresence initial={false}>
                {feedsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: EASE_EDITORIAL }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 mt-1 max-h-60 overflow-y-auto">
                      {feeds.length === 0 && (
                        <div className="px-3 py-2 text-xs text-[var(--foreground-subtle)]">هنوز خوراکی اضافه نشده</div>
                      )}
                      {feeds.slice(0, 100).map((feed) => {
                        const st = feedStatus[feed.id];
                        const broken = st && st.ok === false;
                        const isSelected = selectedFeed === feed.id && activeView === "feed";
                        return (
                          <div key={feed.id} className="group flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => { setSelectedFeed(feed.id); setActiveView("feed"); setSelectedCategory(null); }}
                              className={`flex-1 flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-right text-[12.5px] transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold"
                                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]/70"
                              }`}
                            >
                              <span className="shrink-0">{feed.icon}</span>
                              <span className={`flex-1 truncate ${broken ? "text-[var(--destructive)]" : ""}`}>
                                {feed.name}
                              </span>
                              {broken && <AlertTriangle className="w-3.5 h-3.5 text-[var(--destructive)]" title={st.error || "خطا"} />}
                              {feed.count > 0 && (
                                <span className="text-[11px] tabular-nums text-[var(--foreground-subtle)]">
                                  {feed.count.toLocaleString("fa-IR")}
                                </span>
                              )}
                            </button>
                            {onRemoveFeed && (
                              <button
                                type="button"
                                onClick={() => onRemoveFeed(feed.id)}
                                aria-label={`حذف ${feed.name}`}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--foreground-subtle)] hover:text-[var(--destructive)] transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {feeds.length > 100 && (
                        <div className="px-3 py-1 text-[11px] text-[var(--foreground-subtle)] tabular-nums">
                          و {(feeds.length - 100).toLocaleString("fa-IR")} مورد دیگر…
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Footer Utility Strip */}
      <div className={`${isCollapsed ? "p-2 flex flex-col items-center gap-1" : "px-3 py-2.5"} border-t border-[var(--border-subtle)] bg-[var(--background-subtle)]`}>
        {isCollapsed ? (
          <>
            <button
              type="button"
              onClick={onOpenOpml}
              title="ورود و خروج OPML"
              aria-label="OPML"
              className="size-9 grid place-items-center rounded-[var(--radius-md)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] transition-colors cursor-pointer tactile-btn"
            >
              <FileUp className="w-4 h-4" />
            </button>
            {onOpenRules && (
              <button
                type="button"
                onClick={onOpenRules}
                title="قوانین برچسب خودکار"
                aria-label="قوانین"
                className="size-9 grid place-items-center rounded-[var(--radius-md)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] transition-colors cursor-pointer tactile-btn"
              >
                <Tag className="w-4 h-4" />
              </button>
            )}
            {onOpenHelp && (
              <button
                type="button"
                onClick={onOpenHelp}
                title="میان‌برها (?)"
                aria-label="میان‌برها"
                className="size-9 grid place-items-center rounded-[var(--radius-md)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)] transition-colors cursor-pointer tactile-btn"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <>
            {lastRefresh && (
              <div className="text-[11px] text-[var(--foreground-subtle)] text-center mb-2 tabular-nums">
                به‌روزرسانی: {lastRefresh.toLocaleTimeString("fa-IR")}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenOpml}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-[var(--radius-sm)] bg-[var(--card)] border border-[var(--border-subtle)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer tactile-btn whitespace-nowrap"
              >
                <FileUp className="w-3.5 h-3.5" /> OPML
              </button>
              {onOpenRules && (
                <button
                  type="button"
                  onClick={onOpenRules}
                  title="قوانین برچسب خودکار"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-[var(--radius-sm)] bg-[var(--card)] border border-[var(--border-subtle)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer tactile-btn whitespace-nowrap"
                >
                  <Tag className="w-3.5 h-3.5" /> قوانین
                </button>
              )}
              {onOpenHelp && (
                <button
                  type="button"
                  onClick={onOpenHelp}
                  aria-label="میان‌برهای صفحه‌کلید"
                  title="میان‌برها (?)"
                  className="px-2.5 text-xs py-1.5 rounded-[var(--radius-sm)] bg-[var(--card)] border border-[var(--border-subtle)] hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer tactile-btn"
                >
                  ؟
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
