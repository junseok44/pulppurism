import { Card } from "@/components/ui/card";
import { ThumbsUp, MinusCircle, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

interface VotingWidgetProps {
  agreeCount: number;
  neutralCount: number;
  disagreeCount: number;
  userVote?: "agree" | "neutral" | "disagree";
  onVote?: (vote: "agree" | "neutral" | "disagree") => void;
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
  const [selectedVote, setSelectedVote] = useState(userVote);
  const total = agreeCount + neutralCount + disagreeCount;
  const agreePercent = total > 0 ? (agreeCount / total) * 100 : 0;
  const neutralPercent = total > 0 ? (neutralCount / total) * 100 : 0;
  const disagreePercent = total > 0 ? (disagreeCount / total) * 100 : 0;

  useEffect(() => {
    setSelectedVote(userVote);
  }, [userVote]);

  const handleVote = (vote: "agree" | "neutral" | "disagree") => {
    if (disabled) return;
    setSelectedVote(vote);
    onVote?.(vote);
    console.log("Voted:", vote);
  };

  return (
    <div className="space-y-4" data-testid="widget-voting">
      <h3 className="font-semibold text-lg">투표하기</h3>
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={`p-4 hover-elevate active-elevate-2 ${
            selectedVote === "agree" ? "border-2 border-primary" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => handleVote("agree")}
          data-testid="button-vote-agree"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <ThumbsUp className={`w-8 h-8 ${selectedVote === "agree" ? "text-primary" : ""}`} />
            <span className="font-medium">찬성</span>
            {selectedVote && <span className="text-2xl font-bold">{Math.round(agreePercent)}%</span>}
          </div>
        </Card>
        <Card
          className={`p-4 hover-elevate active-elevate-2 ${
            selectedVote === "neutral" ? "border-2 border-primary" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => handleVote("neutral")}
          data-testid="button-vote-neutral"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <MinusCircle className={`w-8 h-8 ${selectedVote === "neutral" ? "text-primary" : ""}`} />
            <span className="font-medium">중립</span>
            {selectedVote && <span className="text-2xl font-bold">{Math.round(neutralPercent)}%</span>}
          </div>
        </Card>
        <Card
          className={`p-4 hover-elevate active-elevate-2 ${
            selectedVote === "disagree" ? "border-2 border-primary" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => handleVote("disagree")}
          data-testid="button-vote-disagree"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <ThumbsDown className={`w-8 h-8 ${selectedVote === "disagree" ? "text-primary" : ""}`} />
            <span className="font-medium">반대</span>
            {selectedVote && <span className="text-2xl font-bold">{Math.round(disagreePercent)}%</span>}
          </div>
        </Card>
      </div>
      {selectedVote && (
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
