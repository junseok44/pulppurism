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
import { useState, useEffect } from "react";

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

  // 카카오 SDK 초기화
  useEffect(() => {
    const initKakaoSDK = () => {
      if (typeof window === "undefined" || !window.Kakao) {
        return false;
      }

      // 이미 초기화되어 있으면 성공
      if (window.Kakao.isInitialized()) {
        return true;
      }

      // 환경 변수에서 JavaScript 키 가져오기
      const kakaoKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY || "";
      if (!kakaoKey) {
        return false;
      }

      try {
        window.Kakao.init(kakaoKey);
        return window.Kakao.isInitialized();
      } catch (error) {
        return false;
      }
    };

    // 스크립트가 이미 로드되어 있으면 바로 초기화 시도
    if (initKakaoSDK()) {
      return;
    }

    // 스크립트가 로드될 때까지 기다리는 함수
    const waitForKakaoSDK = (retries = 50) => {
      if (retries <= 0) {
        return;
      }

      if (typeof window !== "undefined" && window.Kakao) {
        initKakaoSDK();
      } else {
        setTimeout(() => waitForKakaoSDK(retries - 1), 100);
      }
    };

    // HTML에 이미 스크립트가 있는지 확인
    const existingScript = document.querySelector('script[src*="kakao"]');
    if (existingScript) {
      // 스크립트가 이미 있으면 로드될 때까지 기다림
      waitForKakaoSDK();
    } else {
      // 스크립트가 없으면 동적으로 로드
      const script = document.createElement('script');
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js';
      script.crossOrigin = 'anonymous';
      script.async = true;
      
      script.onload = () => {
        initKakaoSDK();
      };

      document.head.appendChild(script);
    }
  }, []);

  const handleShare = async (platform: 'kakao' | 'copy') => {
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // 클립보드 복사 실패 시 무시
      }
      return;
    }

    if (platform === 'kakao') {
      if (typeof window === "undefined" || !window.Kakao) {
        alert("카카오톡 SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.");
        return;
      }

      if (!window.Kakao.isInitialized()) {
        const kakaoKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY || "";
        if (kakaoKey) {
          try {
            window.Kakao.init(kakaoKey);
          } catch (error) {
            alert("카카오톡 SDK 초기화에 실패했습니다. 환경 변수를 확인해주세요.");
            return;
          }
        } else {
          alert("카카오톡 SDK 키가 설정되지 않았습니다.");
          return;
        }
      }

      // Kakao.Link 또는 Kakao.Share 사용 (SDK 버전에 따라 다름)
      const kakaoShare = window.Kakao.Share || window.Kakao.Link;
      
      if (!kakaoShare || !kakaoShare.sendDefault) {
        alert("카카오톡 공유 기능을 사용할 수 없습니다. SDK 버전을 확인해주세요.");
        return;
      }

      try {
        kakaoShare.sendDefault({
          objectType: 'feed',
          content: {
            title: agenda.title,
            description: agenda.description || '내용을 확인해보세요.',
            imageUrl: 
              'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=400&fit=crop', // 기본 이미지 또는 안건 대표 이미지
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
          buttons: [
            {
              title: '자세히 보기',
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
          ],
        });
      } catch (error) {
        alert("카카오톡 공유 중 오류가 발생했습니다.");
      }
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
        // AbortError는 무시
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

