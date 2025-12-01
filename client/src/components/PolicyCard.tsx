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
      {/* 1. 상단: 단체명 및 날짜 */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-ok_sub1 hover:bg-primary/20 border-0 rounded-md px-2 py-0.5 text-[12px]">
            {agency}
          </Badge>
          <span className="flex items-center gap-1 text-[12px] text-ok_txtgray0 font-medium">
            <CheckCircle2 className="w-4 h-4 text-ok_green" />
            정책 실현됨
          </span>
        </div>
        {date && <span className="text-[12px] text-ok_txtgray0">{date}</span>}
      </div>

      {/* 2. 제목 */}
      <h3 className="font-bold text-base md:text-lg text-gray-900 leading-tight line-clamp-1 group-hover:text-primary transition-colors relative z-10">
        {title}
      </h3>

      {/* 3. 내용 (답변 내용 등) */}
      <p className="text-xs md:text-sm text-ok_txtgray1 line-clamp-2 leading-relaxed relative z-10">
        {content}
      </p>
    </div>
  );
}