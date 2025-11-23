import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, Edit, ArrowLeft, Share2, Copy, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/utils";
import type { Agenda, Category, User } from "@shared/schema";
import { useState } from "react";

interface AgendaHeaderProps {
  agenda: Agenda & { category?: Category; isBookmarked?: boolean };
  user?: User;
  onBookmarkClick: () => void;
  onEditClick?: () => void;
  bookmarkLoading?: boolean;
  showBackButton?: boolean;
}

export default function AgendaHeader({
  agenda,
  user,
  onBookmarkClick,
  onEditClick,
  bookmarkLoading = false,
  showBackButton = false,
}: AgendaHeaderProps) {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/agendas/${agenda.id}`
    : '';
  const shareTitle = agenda.title;
  const shareText = agenda.description || agenda.title;

  const handleShare = async (platform: 'kakao' | 'copy') => {
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      return;
    }

    if (platform === 'kakao') {
      // 카카오톡 링크 공유 (카카오톡 앱이 설치되어 있으면 앱으로, 없으면 웹으로)
      const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/shortlink?url=${encodeURIComponent(shareUrl)}`;
      window.open(kakaoUrl, '_blank', 'width=600,height=600');
    }
  };

  // Web Share API 사용 (모바일)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // 사용자가 공유를 취소한 경우 무시
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // Web Share API를 지원하지 않는 경우 링크 복사
      handleShare('copy');
    }
  };

  return (
    <div className="space-y-4">
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/agendas/${agenda.id}`)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
      )}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {agenda.category?.name || "기타"}
          </Badge>
          <Badge className={`border ${getStatusBadgeClass(agenda.status)}`}>
            {getStatusLabel(agenda.status)}
          </Badge>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold flex-1" data-testid="text-agenda-title">
            {agenda.title}
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {user?.isAdmin && onEditClick && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onEditClick}
                data-testid="button-edit-agenda"
                className="w-14 h-14 hover:bg-primary/10 transition-colors"
              >
                <Edit className="w-10 h-10" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={onBookmarkClick}
              disabled={bookmarkLoading}
              data-testid="button-bookmark"
              className="w-14 h-14 hover:bg-primary/10 transition-colors"
            >
              <Bookmark
                className={`w-10 h-10 ${agenda?.isBookmarked ? "fill-current text-primary" : ""}`}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  data-testid="button-share"
                  className="w-14 h-14 hover:bg-primary/10 transition-colors"
                >
                  <Share2 className="w-10 h-10" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navigator.share && (
                  <DropdownMenuItem onClick={handleNativeShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    공유하기
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleShare('kakao')}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  카카오톡
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? '복사됨!' : '링크 복사'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

