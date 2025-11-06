import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MoreVertical, ArrowLeft, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import CommentThread from "@/components/CommentThread";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";

export default function OpinionDetailPage() {
  const [, setLocation] = useLocation();
  const [liked, setLiked] = useState(true);
  const [likes, setLikes] = useState(12);
  const [comment, setComment] = useState("");

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  // todo: remove mock functionality
  const opinion = {
    id: "1",
    authorName: "김철수",
    content:
      "A초등학교 앞 도로가 너무 위험합니다. 아이들이 등하교할 때 차량 속도가 너무 빠르고, 횡단보도도 부족합니다. 과속방지턱과 신호등 설치가 시급합니다. 학부모로서 매일 불안한 마음으로 아이를 학교에 보내고 있습니다. 하루빨리 안전한 등하교 환경이 조성되길 바랍니다.",
    timestamp: "2시간 전",
    linkedAgenda: {
      id: "1",
      title: "A초등학교 앞 과속방지턱 설치 요청",
      category: "교통",
      status: "검토 중",
      clusterId: "cluster-1",
      clusterName: "초등학교 통학로 안전",
    },
  };

  const comments = [
    {
      id: "1",
      authorName: "박민수",
      content: "저도 같은 문제를 겪고 있습니다. 빠른 조치 부탁드립니다.",
      likeCount: 5,
      isLiked: true,
      timestamp: "1시간 전",
    },
    {
      id: "2",
      authorName: "최지영",
      content: "좋은 의견이네요. 저도 동의합니다!",
      likeCount: 3,
      timestamp: "3시간 전",
    },
    {
      id: "3",
      authorName: "이영희",
      content: "우리 동네도 같은 문제가 있어요. 과속방지턱이 꼭 필요합니다.",
      likeCount: 7,
      timestamp: "5시간 전",
    },
  ];

  const handleSubmitComment = () => {
    if (comment.trim()) {
      console.log("Comment submitted:", comment);
      setComment("");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => window.history.back()}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <div className="space-y-6">
          {opinion.linkedAgenda && (
            <Card className="p-4 bg-primary/5 border-primary/20" data-testid="card-linked-agenda">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 flex items-center gap-2 flex-wrap">
                    이 의견이 안건에 반영되었습니다
                    <Badge variant="secondary" className="text-xs">
                      {opinion.linkedAgenda.status}
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    '{opinion.linkedAgenda.clusterName}' 클러스터를 통해 안건으로 생성되었습니다
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{opinion.linkedAgenda.category}</Badge>
                    <p className="text-sm font-medium">{opinion.linkedAgenda.title}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/agenda/${opinion.linkedAgenda.id}`)}
                  className="flex-shrink-0"
                  data-testid="button-view-agenda"
                >
                  안건 보기
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="w-12 h-12" data-testid="avatar-author">
                <AvatarImage src="" />
                <AvatarFallback>{opinion.authorName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium" data-testid="text-author">
                      {opinion.authorName}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-time">
                      {opinion.timestamp}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" data-testid="button-more">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="pl-15">
              <p className="text-base leading-relaxed" data-testid="text-content">
                {opinion.content}
              </p>
            </div>

            <div className="flex items-center gap-4 pl-15">
              <button
                className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-lg"
                onClick={handleLike}
                data-testid="button-like"
              >
                <Heart
                  className={`w-5 h-5 ${liked ? "fill-current text-primary" : ""}`}
                />
                <span className="font-medium">{likes}</span>
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">
              답글 {comments.length}개
            </h3>
            <CommentThread comments={comments} />
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">답글 작성</h3>
            <div className="space-y-3">
              <Textarea
                placeholder="답글을 입력하세요..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-24"
                data-testid="input-comment"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!comment.trim()}
                  data-testid="button-submit-comment"
                >
                  답글 달기
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
