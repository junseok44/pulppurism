import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Search, Eye, Edit, Trash2, Filter } from "lucide-react";

export default function AllAgendasManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  // todo: remove mock functionality
  const agendas = [
    {
      id: "1",
      title: "A초등학교 앞 과속방지턱 설치 요청",
      category: "교통",
      status: "검토 중",
      votes: {
        agree: 145,
        neutral: 23,
        disagree: 12,
      },
      opinionCount: 15,
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
    },
    {
      id: "2",
      title: "지역 도서관 운영 시간 연장 건의",
      category: "문화",
      status: "진행 중",
      votes: {
        agree: 98,
        neutral: 15,
        disagree: 5,
      },
      opinionCount: 12,
      createdAt: "2024-01-14",
      updatedAt: "2024-01-19",
    },
    {
      id: "3",
      title: "공원 내 야간 소음 규제 방안",
      category: "생활",
      status: "완료",
      votes: {
        agree: 78,
        neutral: 10,
        disagree: 8,
      },
      opinionCount: 8,
      createdAt: "2024-01-10",
      updatedAt: "2024-01-18",
    },
    {
      id: "4",
      title: "어린이 놀이터 시설 개선",
      category: "돌봄",
      status: "보류",
      votes: {
        agree: 52,
        neutral: 8,
        disagree: 3,
      },
      opinionCount: 6,
      createdAt: "2024-01-08",
      updatedAt: "2024-01-17",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "검토 중":
        return "secondary";
      case "진행 중":
        return "default";
      case "완료":
        return "outline";
      case "보류":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">전체 안건 관리</h2>
          <p className="text-muted-foreground">
            모든 안건을 조회하고 수정, 삭제할 수 있습니다
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="제목, 내용으로 검색..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40" data-testid="select-category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              <SelectItem value="traffic">교통</SelectItem>
              <SelectItem value="culture">문화</SelectItem>
              <SelectItem value="education">교육</SelectItem>
              <SelectItem value="care">돌봄</SelectItem>
              <SelectItem value="life">생활</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-32" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="review">검토 중</SelectItem>
              <SelectItem value="progress">진행 중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="hold">보류</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-advanced-filter">
            <Filter className="w-4 h-4 mr-2" />
            고급 필터
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>투표 현황</TableHead>
              <TableHead>의견 수</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>최종 수정</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agendas.map((agenda) => (
              <TableRow key={agenda.id} data-testid={`agenda-row-${agenda.id}`}>
                <TableCell className="font-medium max-w-xs">
                  <p className="truncate">{agenda.title}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{agenda.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(agenda.status)}>
                    {agenda.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">
                      👍 {agenda.votes.agree}
                    </span>
                    <span className="text-muted-foreground">
                      ➖ {agenda.votes.neutral}
                    </span>
                    <span className="text-destructive">
                      👎 {agenda.votes.disagree}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {agenda.opinionCount}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {agenda.createdAt}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {agenda.updatedAt}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-view-${agenda.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-edit-${agenda.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-delete-${agenda.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          전체 {agendas.length}개 안건
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-prev-page">
            이전
          </Button>
          <Button variant="outline" size="sm" data-testid="button-next-page">
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
