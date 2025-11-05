import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Comment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likeCount: number;
  isLiked?: boolean;
  timestamp: string;
}

interface CommentThreadProps {
  comments: Comment[];
}

export default function CommentThread({ comments }: CommentThreadProps) {
  return (
    <div className="space-y-4" data-testid="comment-thread">
      {comments.map((comment) => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}

function CommentItem({
  id,
  authorName,
  authorAvatar,
  content,
  likeCount,
  isLiked = false,
  timestamp,
}: Comment) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <div className="flex gap-3" data-testid={`comment-${id}`}>
      <Avatar className="w-10 h-10">
        <AvatarImage src={authorAvatar} />
        <AvatarFallback>{authorName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div>
          <p className="font-medium text-sm" data-testid={`text-author-${id}`}>{authorName}</p>
          <p className="text-xs text-muted-foreground" data-testid={`text-time-${id}`}>{timestamp}</p>
        </div>
        <p className="text-sm" data-testid={`text-content-${id}`}>{content}</p>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1 text-sm text-muted-foreground hover-elevate active-elevate-2 px-2 py-1 rounded-md"
            onClick={handleLike}
            data-testid={`button-like-${id}`}
          >
            <Heart className={`w-3 h-3 ${liked ? "fill-current text-primary" : ""}`} />
            <span>{likes}</span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-sm text-muted-foreground"
            onClick={() => console.log("Reply clicked")}
            data-testid={`button-reply-${id}`}
          >
            답글
          </Button>
        </div>
      </div>
    </div>
  );
}
