import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bookmark } from "lucide-react";
import { useState } from "react";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/utils";

interface OkAgendaCardProps {
  title: string;
  status: string;
  content: string;
  okinews: boolean;
  id: string;
  category: string;
  commentCount: number;
  bookmarkCount: number;
  isBookmarked?: boolean;
  imageUrl?: string | null; // 🚀 [추가] 이미지 URL (없을 수도 있음)
  onClick?: () => void;
}

export default function OkAgendaCard({
  title,
  status,
  content,
  okinews,
  id,
  category,
  commentCount,
  bookmarkCount,
  isBookmarked,
  imageUrl, // 🚀 props로 받기
  onClick,
}: OkAgendaCardProps) {
  const [count, setCount] = useState(bookmarkCount);
  const [marked, setMarked] = useState(isBookmarked || false);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (marked) {
      setCount(count - 1);
      setMarked(false);
    } else {
      setCount(count + 1);
      setMarked(true);
    }
  };

  return (
    <div
      onClick={onClick}
      // 🚀 [수정] 배경색 관련 클래스를 여기서 제거하고 내부로 옮김.
      // relative와 overflow-hidden은 필수!
      className="relative w-full h-full self-stretch rounded-[10px] overflow-hidden cursor-pointer group transition-transform hover:scale-[1.01]"
    >
      
      {/* ================= 배경 이미지 영역 ================= */}
      <div className="absolute inset-0 w-full h-full z-0">
        {imageUrl ? (
          <>
            {/* 1. 실제 이미지 */}
            <img 
              src={imageUrl} 
              alt="background" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            {/* 2. 이미지 위 그라데이션 (글씨 잘 보이게) */}
            {/* 위쪽은 투명하다가 아래로 갈수록 진한 검정이 됨 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />
          </>
        ) : (
          // 3. 이미지가 없을 때 (기존 회색 그라데이션)
          <div className="w-full h-full bg-blend-multiply bg-gradient-to-b from-neutral-200/50 to-neutral-700/50" />
        )}
      </div>
      {/* =================================================== */}


      {/* ================= 컨텐츠 영역 (z-index로 띄움) ================= */}
      {/* z-10: 배경 위에 올라오게 함 */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-3 py-3 md:px-5 md:py-6">
        
        {/* 1. 최상단 영역 (카테고리 + 북마크 버튼) */}
        <div className="w-full flex justify-between items-start mb-4">
          <Badge
            variant="secondary"
            className="font-medium bg-white/20 text-white hover:bg-white/30 border-0 text-[10px] md:text-xs backdrop-blur-sm"
          >
            {category}
          </Badge>

          <div
            className="flex flex-col items-center justify-center gap-0.5 text-white/90 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-full w-8 h-8 md:w-9 md:h-9 transition-colors cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleBookmarkClick}
              className="group flex items-center justify-center outline-none w-full h-full"
            >
              <Bookmark
                className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-active:scale-90 ${
                  marked
                    ? "fill-white text-white"
                    : "text-white/70 group-hover:text-white"
                }`}
              />
            </button>
            <span className="absolute -bottom-3 text-[9px] md:text-[10px] font-medium text-white/80 leading-none drop-shadow-sm">
              {count}
            </span>
          </div>
        </div>

        {/* 2. 하단 정보 영역 */}
        <div className="flex flex-col justify-end items-start gap-1.5 mt-auto">
          
          {/* 순서 1: 상태 뱃지 + 오키뉴스 + 댓글 */}
          <div className="flex flex-wrap items-center gap-1.5 text-white/90 mb-0.5">
            <Badge className={`text-[10px] backdrop-blur-sm ${getStatusBadgeClass(status)}`}>
              {getStatusLabel(status)}
            </Badge>

            {okinews && (
              <div className="px-1.5 bg-primary rounded-[3px] flex justify-center items-center ml-1 h-[22px] shadow-sm">
                <div className="text-white text-[10px] font-medium leading-none">
                  옥천신문
                </div>
              </div>
            )}

            <Badge 
              variant="secondary"
              className="bg-black/10 text-ok_sand border border-ok_sand backdrop-blur-md gap-1 px-2 py-0.5 h-[22px]"
            >
              <MessageSquare className="w-3 h-3 opacity-90" />
              <span className="text-[10px] md:text-[11px] font-medium leading-none mt-[1px]">
                {commentCount}
              </span>
            </Badge>
          </div>

          {/* 순서 2: 제목 (text-shadow 추가로 가독성 UP) */}
          <div className="w-full font-extrabold text-white text-lg leading-6 md:text-2xl md:leading-7 line-clamp-2 drop-shadow-md">
            {title}
          </div>

          {/* 순서 3: 내용 */}
          <div className="w-full text-white/90 text-[10px] md:text-xs font-medium leading-4 md:leading-5 line-clamp-2 drop-shadow-sm">
            {content}
          </div>

        </div>
      </div>
    </div>
  );
}