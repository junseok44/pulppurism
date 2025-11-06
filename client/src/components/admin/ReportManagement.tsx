import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Check, X, MessageSquare } from "lucide-react";

export default function ReportManagement() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState(false);

  // todo: remove mock functionality
  const reports = [
    {
      id: "1",
      type: "opinion",
      targetAuthor: "김철수",
      targetContent: "A초등학교 앞 도로가 너무 위험합니다...",
      reportCount: 3,
      reporters: ["이영희", "박민수", "최지영"],
      reasons: ["부적절한 표현", "허위 정보", "스팸"],
      status: "대기 중",
      createdAt: "2024-01-15 10:30",
    },
    {
      id: "2",
      type: "comment",
      targetAuthor: "이영희",
      targetContent: "이건 말도 안 되는 의견입니다.",
      reportCount: 1,
      reporters: ["박민수"],
      reasons: ["부적절한 표현"],
      status: "대기 중",
      createdAt: "2024-01-15 09:15",
    },
    {
      id: "3",
      type: "opinion",
      targetAuthor: "최지영",
      targetContent: "공원 소음이 심합니다...",
      reportCount: 5,
      reporters: ["김철수", "이영희", "박민수", "정민호", "강서연"],
      reasons: ["부적절한 표현", "명예훼손"],
      status: "처리 완료",
      action: "숨김",
      createdAt: "2024-01-14 16:20",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "대기 중":
        return "destructive";
      case "처리 완료":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "opinion" ? "의견" : "답글";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">신고 관리</h2>
          <p className="text-muted-foreground">
            신고된 의견과 답글을 검토하고 조치합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="pending">대기 중</SelectItem>
              <SelectItem value="completed">처리 완료</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-40" data-testid="select-type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="opinion">의견</SelectItem>
              <SelectItem value="comment">답글</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <Card
            key={report.id}
            className={`p-6 ${
              report.status === "대기 중" ? "border-l-4 border-l-destructive" : ""
            }`}
            data-testid={`report-${report.id}`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <h3 className="font-semibold">
                      {getTypeLabel(report.type)} 신고
                    </h3>
                    <Badge variant={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                    {report.status === "처리 완료" && report.action && (
                      <Badge variant="outline">{report.action}</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      작성자: <span className="font-medium">{report.targetAuthor}</span>
                    </p>
                    <p className="text-sm">"{report.targetContent}"</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        신고 {report.reportCount}건
                      </span>
                      <span>{report.createdAt}</span>
                    </div>
                  </div>
                </div>
                {report.status === "대기 중" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report.id);
                        setActionDialog(true);
                      }}
                      data-testid={`button-hide-${report.id}`}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      숨김
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-approve-${report.id}`}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      정상
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <h4 className="font-semibold text-sm">신고 사유</h4>
                <div className="flex flex-wrap gap-2">
                  {report.reasons.map((reason, idx) => (
                    <Badge key={idx} variant="secondary">
                      {reason}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    신고자: {report.reporters.join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" data-testid={`button-view-detail-${report.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  원문 보기
                </Button>
                {report.type === "comment" && (
                  <Button variant="outline" size="sm" data-testid={`button-view-context-${report.id}`}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    맥락 보기
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent data-testid="dialog-action">
          <DialogHeader>
            <DialogTitle>신고된 콘텐츠 숨김 처리</DialogTitle>
            <DialogDescription>
              이 콘텐츠를 숨김 처리하시겠습니까? 숨김 처리된 콘텐츠는 일반 사용자에게
              표시되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">처리 사유 (선택)</label>
              <Textarea
                placeholder="처리 사유를 입력하세요"
                data-testid="input-action-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(false)}
              data-testid="button-cancel-action"
            >
              취소
            </Button>
            <Button variant="destructive" data-testid="button-confirm-action">
              숨김 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
