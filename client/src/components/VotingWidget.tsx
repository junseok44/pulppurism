import { Progress } from "@/components/ui/progress";

interface VotingWidgetProps {
  agreeCount: number;
  neutralCount: number;
  disagreeCount: number;
  userVote?: "agree" | "neutral" | "disagree";
  onVote?: (vote: "agree" | "neutral" | "disagree" | null) => void;
  disabled?: boolean;
}

export default function VotingWidget({
  agreeCount,
  neutralCount,
  disagreeCount,
  userVote,
  onVote,
  disabled = false,
}: VotingWidgetProps) {
  const total = agreeCount + neutralCount + disagreeCount;
  const agreePercent = total > 0 ? (agreeCount / total) * 100 : 0;
  const neutralPercent = total > 0 ? (neutralCount / total) * 100 : 0;
  const disagreePercent = total > 0 ? (disagreeCount / total) * 100 : 0;

  const handleVote = (vote: "agree" | "neutral" | "disagree") => {
    if (disabled) return;
    
    if (userVote === vote) {
      onVote?.(null);
      console.log("Vote cancelled");
    } else {
      onVote?.(vote);
      console.log("Voted:", vote);
    }
  };

  return (
    <div className="space-y-3" data-testid="widget-voting">
      <h2 className="text-xl font-semibold">투표하기</h2>
      <div className="w-full h-16 flex items-center gap-2">
        <div
          className={`flex-1 h-full px-3 py-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg flex flex-row items-center justify-center gap-2 ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:bg-neutral-400 dark:hover:bg-neutral-600 active:scale-95 transition-all"
          } ${userVote === "agree" ? "ring-2 ring-green-700 bg-green-100 dark:bg-green-900" : ""}`}
          onClick={() => handleVote("agree")}
          data-testid="button-vote-agree"
        >
          <div className="w-4 h-4 rounded-full border-2 border-green-700"></div>
          <div className="text-center text-green-700 text-sm font-semibold">
            찬성
          </div>
        </div>

        <div
          className={`flex-1 h-full px-3 py-2 bg-amber-200 dark:bg-amber-300 rounded-lg flex flex-row items-center justify-center gap-2 ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:bg-amber-300 dark:hover:bg-amber-400 active:scale-95 transition-all"
          } ${userVote === "neutral" ? "ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-800" : ""}`}
          onClick={() => handleVote("neutral")}
          data-testid="button-vote-neutral"
        >
          <div className="w-4 h-0 border-t-2 border-amber-500"></div>
          <div className="text-center text-amber-500 dark:text-amber-600 text-sm font-semibold">
            중립
          </div>
        </div>

        <div
          className={`flex-1 h-full px-3 py-2 bg-rose-300 dark:bg-rose-400 rounded-lg flex flex-row items-center justify-center gap-2 ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:bg-rose-400 dark:hover:bg-rose-500 active:scale-95 transition-all"
          } ${userVote === "disagree" ? "ring-2 ring-red-600 bg-rose-100 dark:bg-rose-900" : ""}`}
          onClick={() => handleVote("disagree")}
          data-testid="button-vote-disagree"
        >
          <div className="w-4 h-4 relative">
            <div className="w-3 h-0 absolute top-2 left-0.5 rotate-45 border-t-2 border-red-600"></div>
            <div className="w-3 h-0 absolute top-2 left-0.5 -rotate-45 border-t-2 border-red-600"></div>
          </div>
          <div className="text-center text-red-600 text-sm font-semibold">
            반대
          </div>
        </div>
      </div>
      {userVote && (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>찬성</span>
              <span className="text-muted-foreground">{agreeCount}표</span>
            </div>
            <Progress value={agreePercent} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>중립</span>
              <span className="text-muted-foreground">{neutralCount}표</span>
            </div>
            <Progress value={neutralPercent} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>반대</span>
              <span className="text-muted-foreground">{disagreeCount}표</span>
            </div>
            <Progress value={disagreePercent} className="h-2" />
          </div>
        </div>
      )}
    </div>
  );
}
