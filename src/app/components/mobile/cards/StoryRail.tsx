import { useId, useMemo } from "react";
import { motion, useIsPresent } from "motion/react";
import type { Article } from "../../../data";
import { BUILT_IN_TOPICS, scoreArticleForTopic } from "../../../topics";
import { faNum } from "../utils/fa";
import { SPRING_SNAPPY } from "../../../motionChoreography";

type Props = {
  articles: Article[];
  activeTopicId: string | null;
  onPick: (topicId: string | null) => void;
};

export function StoryRail({ articles, activeTopicId, onPick }: Props) {
  const pillId = useId();
  const items = useMemo(() => {
    return BUILT_IN_TOPICS.map((t) => {
      const matches = articles.filter((a) => scoreArticleForTopic(a, t).score > 0);
      const unread = matches.filter((a) => !a.read).length;
      return { topic: t, total: matches.length, unread };
    }).filter((x) => x.total > 0);
  }, [articles]);

  if (items.length === 0) return null;

  return (
    <div className="px-2 pt-1.5 pb-2">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none snap-x px-2">
        <Chip
          pillId={pillId}
          active={activeTopicId === null}
          onClick={() => onPick(null)}
          label="همه"
          count={articles.length}
        />
        {items.map(({ topic, unread }) => (
          <Chip
            key={topic.id}
            pillId={pillId}
            active={activeTopicId === topic.id}
            onClick={() => onPick(activeTopicId === topic.id ? null : topic.id)}
            label={topic.name}
            count={unread}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  pillId,
  active,
  onClick,
  label,
  count,
}: {
  pillId: string;
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  const isPresent = useIsPresent();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 snap-start h-9 inline-flex items-center gap-1.5 px-3.5 rounded-full text-[12.5px] tap transition-colors whitespace-nowrap ${
        active
          ? "text-[var(--primary-foreground)] font-semibold"
          : "bg-[var(--background-muted)] text-[var(--foreground-muted)] font-medium"
      }`}
    >
      {active && isPresent && (
        <motion.span
          layoutId={pillId}
          transition={SPRING_SNAPPY}
          className="absolute inset-0 rounded-full bg-[var(--primary)]"
        />
      )}
      <span className="relative z-10 leading-none">{label}</span>
      {count > 0 && (
        <span
          className={`relative z-10 text-[10.5px] tabular-nums leading-none ${
            active ? "opacity-85" : "text-[var(--foreground-subtle)]"
          }`}
        >
          · {faNum(count > 99 ? 99 : count)}
        </span>
      )}
    </button>
  );
}
