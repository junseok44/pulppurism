import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MessageSquare, Bookmark, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStatusBadgeClass, getStatusLabel } from "@/lib/utils";

interface AgendaCardProps {
  id: string;
  title: string;
  category: string;
  status: string;
  commentCount: number;
  bookmarkCount: number;
  isBookmarked?: boolean;
  onClick?: () => void;
}

export default function AgendaCard({
  id,
  title,
  category,
  status,
  commentCount,
  bookmarkCount,
  isBookmarked = false,
  onClick,
}: AgendaCardProps) {

  return (
    <Card
      className="p-6 cursor-pointer hover-elevate active-elevate-2 relative overflow-hidden group"
      onClick={onClick}
      data-testid={`card-agenda-${id}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 transition-transform group-hover:scale-150" />
      
      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-3 leading-snug" data-testid={`text-title-${id}`}>
              {title}
            </h3>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Bookmark toggled");
            }}
            data-testid={`button-bookmark-${id}`}
            className="flex-shrink-0"
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current text-primary" : ""}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="font-medium" data-testid={`badge-category-${id}`}>
            {category}
          </Badge>
          <Badge 
            className={`font-medium border ${getStatusBadgeClass(status)}`}
            data-testid={`badge-status-${id}`}
          >
            {getStatusLabel(status)}
          </Badge>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground" data-testid={`text-comments-${id}`}>
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium">{commentCount}</span>
            <span className="text-xs">참여</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground" data-testid={`text-bookmarks-${id}`}>
            <Bookmark className="w-4 h-4" />
            <span className="font-medium">{bookmarkCount}</span>
            <span className="text-xs">관심</span>
          </span>
          {commentCount > 50 && (
            <span className="flex items-center gap-1.5 text-primary">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">인기</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
