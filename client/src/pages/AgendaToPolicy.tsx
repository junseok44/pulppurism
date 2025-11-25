import { useState } from "react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Hammer, ArrowRight } from "lucide-react";

// 1️⃣ 나중에 API에서 받아올 데이터 형태 (Dummy Data)
const MOCK_POLICIES = [
  {
    id: 1,
    title: "마을 입구 가로등 추가 설치",
    description: "밤길이 너무 어둡다는 주민들의 의견을 수렴하여, 입구부터 놀이터까지 LED 가로등 5개를 추가 설치합니다.",
    status: "COMPLETED", // 진행 상태
    progress: 100, // 진행률 (%)
    date: "2024.03.15 완료",
    category: "안전/치안",
    updates: "설치 완료 및 점등 테스트 통과",
  },
  {
    id: 2,
    title: "주민센터 앞 횡단보도 신호등 시간 연장",
    description: "어르신들의 보행 속도를 고려해 보행자 신호 시간을 기존 20초에서 30초로 연장하는 안건입니다.",
    status: "IN_PROGRESS",
    progress: 60,
    date: "2024.04.01 시행 예정",
    category: "교통",
    updates: "경찰청 심의 통과, 신호 체계 변경 작업 중",
  },
  {
    id: 3,
    title: "공원 내 반려견 배변봉투함 설치",
    description: "쾌적한 공원 환경을 위해 산책로 입구 2곳에 배변봉투함을 시범 설치합니다.",
    status: "PLANNING",
    progress: 20,
    date: "2024.05.01 목표",
    category: "환경",
    updates: "예산 배정 완료, 업체 선정 단계",
  },
  {
    id: 4,
    title: "매주 수요일 '재활용 정거장' 운영",
    description: "분리수거가 어려운 빌라촌을 위해 이동식 분리수거 정거장을 운영합니다.",
    status: "IN_PROGRESS",
    progress: 45,
    date: "2024.04.15 시범운영",
    category: "환경",
    updates: "자원봉사자 모집 중 (현재 80% 달성)",
  },
];

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="w-full max-w-5xl mx-auto px-4 py-8">
        
        {/* 헤더 섹션 */}
        <div className="text-center mb-10 space-y-2">
          {/* font-bagel 제거 -> 깔끔한 기본 폰트 */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            정책 실현 현황 🚀
          </h1>
          <p className="text-gray-500">
            주민의 의견이 현실이 되는 과정을 투명하게 공개합니다.
          </p>
        </div>

        {/* 통계 요약 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-gray-100">
            {/* 숫자 부분 폰트 제거 */}
            <div className="text-2xl font-bold text-blue-600">12건</div>
            <div className="text-xs text-gray-400">실현 완료</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-gray-100">
            <div className="text-2xl font-bold text-orange-500">5건</div>
            <div className="text-xs text-gray-400">진행 중</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-gray-100">
            <div className="text-2xl font-bold text-gray-700">100%</div>
            <div className="text-xs text-gray-400">주민 만족도</div>
          </div>
        </div>

        {/* 정책 리스트 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_POLICIES.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </div>

      </main>

      <MobileNav />
    </div>
  );
}

// 2️⃣ 정책 카드 컴포넌트
function PolicyCard({ policy }: { policy: any }) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return { color: "bg-green-100 text-green-700", icon: CheckCircle2, text: "실현 완료" };
      case "IN_PROGRESS":
        return { color: "bg-blue-100 text-blue-700", icon: Hammer, text: "진행 중" };
      case "PLANNING":
        return { color: "bg-orange-100 text-orange-700", icon: Clock, text: "계획 수립" };
      default:
        return { color: "bg-gray-100 text-gray-700", icon: Clock, text: "대기 중" };
    }
  };

  const statusStyle = getStatusStyle(policy.status);
  const StatusIcon = statusStyle.icon;

  return (
    <div className="bg-ok_gray1 rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between h-full group">
      <div>
        {/* 상단 뱃지 영역 */}
        <div className="flex justify-between items-start mb-4">
          <Badge variant="secondary" className={`${statusStyle.color} border-0 px-3 py-1`}>
            <StatusIcon className="w-3.5 h-3.5 mr-1" />
            {statusStyle.text}
          </Badge>
          <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full">
            {policy.category}
          </span>
        </div>

        {/* 타이틀: font-bagel 제거 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {policy.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-6">
          {policy.description}
        </p>
      </div>

      {/* 하단 진행률 및 정보 */}
      <div className="bg-gray-50 rounded-2xl p-4 mt-auto">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-gray-700">진행률</span>
          <span className="text-sm font-bold text-blue-600">{policy.progress}%</span>
        </div>
        
        {/* 프로그레스 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-1000 ${
              policy.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${policy.progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200">
          <span className="text-gray-500 flex items-center">
            최근 업데이트: {policy.updates}
          </span>
        </div>
      </div>
      
    </div>
  );
}