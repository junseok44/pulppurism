import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MessageSquare, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      className="p-6 cursor-pointer hover-elevate active-elevate-2"
      onClick={onClick}
      data-testid={`card-agenda-${id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <h3 className="text-xl font-semibold line-clamp-1" data-testid={`text-title-${id}`}>
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${id}`}>
              {category}
            </Badge>
            <Badge variant="outline" className="text-xs" data-testid={`badge-status-${id}`}>
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1" data-testid={`text-comments-${id}`}>
              <MessageSquare className="w-4 h-4" />
              {commentCount}
            </span>
            <span className="flex items-center gap-1" data-testid={`text-bookmarks-${id}`}>
              <Bookmark className="w-4 h-4" />
              {bookmarkCount}
            </span>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            console.log("Bookmark toggled");
          }}
          data-testid={`button-bookmark-${id}`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current text-primary" : ""}`} />
        </Button>
      </div>
    </Card>
  );
}
