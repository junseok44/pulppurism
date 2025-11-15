import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bookmark, TrendingUp } from "lucide-react";
import { useState } from "react";

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
  const getStatusColor = () => {
    switch (status) {
      case "투표 중":
      case "주민 투표":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "활성":
      case "검토 중":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800";
      case "시행됨":
      case "진행 중":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
      case "종료":
      case "답변 완료":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800";
      case "초안":
      case "의견 접수":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      default:
        return "";
    }
  };
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
    // 1. inline-flex -> flex 로 변경 (레이아웃 안정화)
    // 2. onClick 추가 (카드 클릭하면 이동해야지!)
    <div
      onClick={onClick}
      className="w-full h-full self-stretch px-5 py-6 bg-blend-multiply bg-gradient-to-b from-neutral-200/50 to-neutral-700/50 rounded-[10px] flex flex-col justify-start items-start gap-2.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
    >
      <div className="h-full w-full flex">
        {" "}
        {/*category+alpha*/}
        <div className="self-stretch flex-col">
          {/*얘네는 세로로 배치 */}
          <div className="self-stretch py-[3px] inline-flex justify-start items-start gap-2.5 overflow-hidden">
            {/* 카테고리 뱃지 */}
            <Badge
              variant="secondary"
              className="font-medium bg-white/20 text-white hover:bg-white/30 border-0"
              data-testid={`badge-category-${id}`}
            >
              {category}
            </Badge>
          </div>
          <div className="self-stretch flex-1 relative"></div>
        </div>
        <div className="w-full flex justify-end mb-auto">
          {" "}
          {/* mt-auto: 아래로 밀어내기 */}
          <div
            className="flex items-center gap-3 px-3 py-1.5 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-full transition-colors cursor-default"
            onClick={(e) => e.stopPropagation()} // 트레이 눌렀을 때 카드 이동 방지
          >
            {/* 1. 북마크 버튼 (Button 컴포넌트 X -> 일반 button O) */}
            <div className="flex items-center gap-1.5 text-white/90">
              <button
                onClick={handleBookmarkClick} // 👈 아까 만든 함수 연결!
                className="group flex items-center justify-center outline-none"
              >
                <Bookmark
                  className={`w-4 h-4 transition-transform group-active:scale-90 ${
                    // 👈 이제 props(isBookmarked)가 아니라 내 상태(marked)를 씀!
                    marked
                      ? "fill-white text-white"
                      : "text-white/70 group-hover:text-white"
                  }`}
                />
              </button>
              {/* 댓글 아이콘 옆에 북마크 숫자(count) 보여주기 */}
              {/* 👇 북마크 숫자도 같이 보고 싶으면 아래 코드 추가 */}
              <span className="text-xs font-medium text-white">{count}</span>
            </div>
            {/* 얇은 구분선 (옵션) */}
            <div className="w-[1px] h-3 bg-white/20"></div>
            {/* 2. 댓글 아이콘 */}
            <div className="flex items-center gap-1.5 text-white/90">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-xs font-medium pt-[1px] leading-none">
                {commentCount}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="self-stretch flex flex-col justify-end items-center gap-4">
        <div className="self-stretch inline-flex justify-center items-center">
          <div className="flex-1 py-1 inline-flex flex-col justify-center items-start gap-1.5 overflow-hidden">
            <div className="self-stretch flex flex-col justify-start items-start gap-px">
              <div className="inline-flex justify-center items-center gap-2.5 overflow-hidden">
                {/*여기부터는 하단에 붙은 내용들 중 가장 윗줄... 왼->오 정렬됨*/}
                {/* 3. getStatusColor() 적용! (이제 색깔이 상태에 따라 바뀔 거야) */}
                <div
                  className={`px-1.5 rounded-[3px] inline-flex flex-col justify-center items-center gap-2.5 ${getStatusColor()}`}
                >
                  <div className="justify-start text-[10px] font-medium font-['Pretendard_Variable'] leading-5">
                    {status}
                  </div>
                </div>

                {/* 4. okinews 조건부 렌더링! (true일 때만 보여라!) */}
                {okinews && (
                  <div className="px-1.5 bg-primary rounded-[3px] inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
                    <div className="justify-start text-ok_white1 text-[10px] font-medium font-['Pretendard_Variable'] leading-5">
                      옥천신문 보도
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="self-stretch flex flex-col justify-start items-start gap-px">
              <div className="self-stretch inline-flex justify-center items-center gap-2.5 overflow-hidden">
                {/* line-clamp-3 추가해서 글자 넘침 방지 */}
                <div className="flex-1 justify-start text-ok_white1 text-[10px] font-medium font-['Pretendard_Variable'] leading-4 line-clamp-3">
                  {content}
                </div>
              </div>
            </div>

            {/* 제목 */}
            <div className="self-stretch justify-start text-white text-2xl font-extrabold font-['Pretendard_Variable'] leading-7 line-clamp-2">
              {title}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
