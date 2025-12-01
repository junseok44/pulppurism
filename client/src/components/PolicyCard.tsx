import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface PolicyCardProps {
  title: string;
  content: string;
  agency: string; // 답변 준 단체명 (예: 옥천군청)
  date?: string;
  onClick?: () => void;
}

export default function PolicyCard({
  title,
  content,
  agency,
  date,
  onClick,
}: PolicyCardProps) {
  return (
    <div
      onClick={onClick}
      className="group w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer flex flex-col gap-3 text-left relative overflow-hidden"
    >
      {/* 장식용 배경 원 (은은하게) */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />

      {/* 1. 상단: 단체명 및 날짜 */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0 rounded-md px-2 py-0.5 text-[10px] font-bold">
            {agency}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            정책 실현됨
          </span>
        </div>
        {date && <span className="text-[10px] text-gray-400">{date}</span>}
      </div>

      {/* 2. 제목 */}
      <h3 className="font-bold text-base md:text-lg text-gray-900 leading-tight line-clamp-1 group-hover:text-primary transition-colors relative z-10">
        {title}
      </h3>

      {/* 3. 내용 (답변 내용 등) */}
      <p className="text-xs md:text-sm text-gray-500 line-clamp-2 leading-relaxed relative z-10">
        {content}
      </p>

      {/* 화살표 아이콘 (호버 시 이동) */}
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 text-primary">
        <ArrowRight className="w-5 h-5" />
      </div>
    </div>
  );
}