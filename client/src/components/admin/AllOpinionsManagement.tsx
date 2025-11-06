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
import { Search, Eye, EyeOff, Trash2, Filter } from "lucide-react";

export default function AllOpinionsManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  // todo: remove mock functionality
  const opinions = [
    {
      id: "1",
      author: "김철수",
      title: "A초등학교 앞 과속방지턱 설치 요청",
      category: "교통",
      likes: 12,
      comments: 5,
      status: "공개",
      linkedAgenda: "A초등학교 앞 과속방지턱 설치",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      author: "이영희",
      title: "도서관 운영 시간 연장 건의",
      category: "문화",
      likes: 8,
      comments: 3,
      status: "공개",
      linkedAgenda: null,
      createdAt: "2024-01-14",
    },
    {
      id: "3",
      author: "박민수",
      title: "공원 소음 문제 해결 방안",
      category: "생활",
      likes: 15,
      comments: 7,
      status: "숨김",
      linkedAgenda: "공원 야간 소음 규제",
      createdAt: "2024-01-13",
    },
    {
      id: "4",
      author: "최지영",
      title: "놀이터 시설 개선 요청",
      category: "돌봄",
      likes: 6,
      comments: 2,
      status: "공개",
      linkedAgenda: null,
      createdAt: "2024-01-12",
    },
  ];

  const getStatusColor = (status: string) => {
    return status === "공개" ? "default" : "secondary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">전체 의견 관리</h2>
        <p className="text-muted-foreground">
          모든 의견을 검색하고 관리합니다
        </p>
      </div>

      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="제목, 작성자, 내용으로 검색..."
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
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-32" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="visible">공개</SelectItem>
              <SelectItem value="hidden">숨김</SelectItem>
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
              <TableHead>작성자</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>반응</TableHead>
              <TableHead>연결된 안건</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>작성일</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opinions.map((opinion) => (
              <TableRow key={opinion.id} data-testid={`opinion-row-${opinion.id}`}>
                <TableCell className="font-medium max-w-xs">
                  <p className="truncate">{opinion.title}</p>
                </TableCell>
                <TableCell>{opinion.author}</TableCell>
                <TableCell>
                  <Badge variant="outline">{opinion.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 text-sm">
                    <span>👍 {opinion.likes}</span>
                    <span>💬 {opinion.comments}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {opinion.linkedAgenda ? (
                    <Badge variant="secondary" className="text-xs">
                      {opinion.linkedAgenda}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(opinion.status)}>
                    {opinion.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {opinion.createdAt}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-view-${opinion.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-toggle-visibility-${opinion.id}`}
                    >
                      {opinion.status === "공개" ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-delete-${opinion.id}`}
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
          전체 {opinions.length}개 의견
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
