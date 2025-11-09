import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Comment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
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
  timestamp,
}: Comment) {
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
      </div>
    </div>
  );
}
