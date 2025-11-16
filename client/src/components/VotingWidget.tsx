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
    <div className="space-y-4" data-testid="widget-voting">
      <h3 className="font-semibold text-lg">투표하기</h3>
      <div className="w-full h-[14vh] md:h-[28vh] flex items-center gap-2.5">
        <div
          className={`flex-1 h-full px-5 bg-neutral-300 dark:bg-neutral-700 rounded-xl flex flex-col justify-center items-center gap-1 overflow-hidden ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover-elevate active-elevate-2"
          } ${userVote === "agree" ? "ring-2 ring-green-700" : ""}`}
          onClick={() => handleVote("agree")}
          data-testid="button-vote-agree"
        >
          <div className="w-6 h-6 rounded-full border-[5px] border-green-700"></div>
          <div className="text-center text-green-700 text-base font-black h-5 flex items-center justify-center">
            찬성한다
          </div>
        </div>

        <div
          className={`flex-1 h-full px-5 bg-amber-200 dark:bg-amber-300 rounded-xl flex flex-col justify-center items-center gap-1 overflow-hidden ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover-elevate active-elevate-2"
          } ${userVote === "neutral" ? "ring-2 ring-amber-500" : ""}`}
          onClick={() => handleVote("neutral")}
          data-testid="button-vote-neutral"
        >
          <div className="w-6 h-6 relative overflow-hidden">
            <div className="w-6 h-0 absolute top-3 left-0 border-t-[5px] border-amber-500"></div>
          </div>
          <div className="text-center text-amber-500 dark:text-amber-600 text-base font-black h-5 flex items-center justify-center">
            중립이다
          </div>
        </div>

        <div
          className={`flex-1 h-full px-5 bg-rose-300 dark:bg-rose-400 rounded-xl flex flex-col justify-center items-center gap-1 overflow-hidden ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover-elevate active-elevate-2"
          } ${userVote === "disagree" ? "ring-2 ring-red-600" : ""}`}
          onClick={() => handleVote("disagree")}
          data-testid="button-vote-disagree"
        >
          <div className="w-5 h-5 relative">
            <div className="w-7 h-0 absolute top-2.5 left-[-3px] rotate-45 border-t-[5px] border-red-600"></div>
            <div className="w-7 h-0 absolute top-2.5 left-[-3px] -rotate-45 border-t-[5px] border-red-600"></div>
          </div>
          <div className="text-center text-red-600 text-base font-black h-5 flex items-center justify-center">
            반대한다
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
