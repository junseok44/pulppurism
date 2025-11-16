import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bookmark, TrendingUp } from "lucide-react";
import { useState } from "react";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/utils";

// Card 같은 거 import 안 함! 내가 직접 만드니까!

interface OkAgendaCardProps {
  title: string; // 실제 제목 : ex. 안남 초등학교 앞 신호등 대기신이 너무 길어요
  status: string;
  content: string; // 내용 : 안건의 세부내용, 개요 등의 detail
  okinews: boolean;
  id: string; //id가 기존에 있던 자료 형탠데, 이게 뭔지 모르겠음...!
  category: string; // 생활, 교통...
  commentCount: number; // 댓글수
  bookmarkCount: number; // 북마크, 즐겨찾기 수
  isBookmarked?: boolean; // 사용자가 북마크를 했는지?
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
  onClick,
}: OkAgendaCardProps) {
  const [count, setCount] = useState(bookmarkCount);
  const [marked, setMarked] = useState(isBookmarked || false);
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트(페이지 이동) 막기
    if (marked) {
      // 이미 눌려있으면? -> 취소하기 (-1)
      setCount(count - 1);
      setMarked(false);
      console.log("북마크 취소!");
    } else {
      // 안 눌려있으면? -> 추가하기 (+1)
      setCount(count + 1);
      setMarked(true);
      console.log("북마크 추가!");
    }
  };

  return (
    // 1. 카드 전체: 모바일(gap-2, p-4), 데스크탑(md:gap-4, md:p-6)
    <div
      onClick={onClick}
      className="w-full h-full self-stretch px-4 py-4 md:px-5 md:py-6 bg-blend-multiply bg-gradient-to-b from-neutral-200/50 to-neutral-700/50 rounded-[10px] flex flex-col justify-start items-start gap-2 md:gap-4 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
    >
      {/* --- 2. 윗줄 --- */}
      {/* * flex (가로) / justify-between (양쪽 정렬) / items-start (위로 정렬)
        * 버그의 원인이었던 래퍼(wrapper)들 싹 제거!
      */}
      <div className="w-full flex justify-between items-start">

        {/* 2a. 윗줄 - 왼쪽 (카테고리) - 모바일(text-[10px]), 데스크탑(md:text-xs) */}
        <Badge
          variant="secondary"
          className="font-medium bg-white/20 text-white hover:bg-white/30 border-0 text-[10px] md:text-xs"
          data-testid={`badge-category-${id}`}
        >
          {category}
        </Badge>

        {/* 2b. 윗줄 - 오른쪽 (버튼 트레이) - 모바일(gap-1), 데스크탑(md:gap-1.5) */}
        <div
          className="flex flex-col gap-1 md:gap-1.5 items-center justify-center cursor-default"
          onClick={(e) => e.stopPropagation()} // 트레이 눌렀을 때 카드 이동 방지
        >
          {/* 1. 북마크 '원' 버튼 - 모바일(w-8 h-8), 데스크탑(md:w-9 md:h-9) */}
          <div className="flex flex-col items-center justify-center gap-0.2 text-white/90 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-full w-8 h-8 md:w-9 md:h-9 transition-colors cursor-default">
            <button
              onClick={handleBookmarkClick}
              className="group flex items-center justify-center outline-none"
            >
              {/* 아이콘 크기: 모바일(w-3.5 h-3.5), 데스크탑(md:w-4 md:h-4) */}
              <Bookmark
                className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-active:scale-90 ${
                  marked
                    ? "fill-white text-white"
                    : "text-white/70 group-hover:text-white"
                }`}
              />
            </button>
            {/* 숫자 크기: 모바일(text-[10px]), 데스크탑(md:text-xs) */}
            <span className="text-[9px] md:text-[10px] font-medium text-white leading-none">
              {count}
            </span>
          </div>

          {/* 2. 댓글 '원' 버튼 - 모바일(w-8 h-8), 데스크탑(md:w-9 md:h-9) */}
          <div className="flex flex-col items-center justify-center gap-0.2 text-white/90 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-full w-8 h-8 md:w-9 md:h-9 transition-colors cursor-default">
            {/* 아이콘 크기: 모바일(w-3 h-3), 데스크탑(md:w-3.5 md:h-3.5) */}
            <MessageSquare className="w-3 h-3 md:w-3.5 md:h-3.5" />
            {/* 숫자 크기: 모바일(text-[10px]), 데스크탑(md:text-xs) */}
            <span className="text-[9px] md:text-[10px] font-medium pt-[1px] leading-none">
              {commentCount}
            </span>
          </div>
        </div>
      </div>

      {/* --- 3. 아랫줄 --- */}
      {/*
        * flex-1: 윗줄을 제외한 '남은 공간 전부'를 차지함 (핵심!)
        * justify-end: 내용물(제목, 내용 등)을 이 '아랫줄' 공간의 맨 아래에 붙임
      */}
      <div className="self-stretch flex-1 flex flex-col justify-end items-start gap-1 md:gap-1.5">
        {/* 3a. 상태 + 오키뉴스 (이건 text-[10px] 유지해도 될 듯) */}
        <div className="flex justify-start items-center gap-2.5">
          <Badge className={`text-[10px] ${getStatusBadgeClass(status)}`}>
            {getStatusLabel(status)}
          </Badge>
          {okinews && (
            <div className="px-1.5 bg-primary rounded-[3px] flex justify-center items-center">
              <div className="text-ok_white1 text-[10px] font-medium leading-5">
                옥천신문 보도
              </div>
            </div>
          )}
        </div>

        {/* 3b. 내용 - 모바일(text-[10px]), 데스크탑(md:text-xs) */}
        <div className="self-stretch justify-start text-ok_white1 text-[10px] md:text-xs font-medium leading-4 md:leading-5 line-clamp-3">
          {content}
        </div>

        {/* 3c. 제목 - 모바일(text-lg leading-6), 데스크탑(md:text-2xl md:leading-7) */}
        <div className="self-stretch justify-start font-extrabold text-white text-lg leading-6 md:text-2xl md:font-extrabold md:leading-7 line-clamp-2">
          {title}
        </div>
      </div>
    </div>
  );
}