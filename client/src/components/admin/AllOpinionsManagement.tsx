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
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, CheckCircle, XCircle, ThumbsUp, MessageSquare } from "lucide-react";
import type { Opinion, Category } from "@shared/schema";

export default function AllOpinionsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: opinions = [], isLoading } = useQuery<Opinion[]>({
    queryKey: ["/api/opinions"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/opinions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      toast({
        title: "의견 삭제 완료",
        description: "의견이 성공적으로 삭제되었습니다.",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/opinions/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      toast({
        title: "상태 변경 완료",
        description: "의견 상태가 변경되었습니다.",
      });
    },
  });

  const filteredOpinions = opinions.filter((opinion) => {
    const matchesSearch = opinion.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || opinion.status === statusFilter;
    const matchesCategory = 
      categoryFilter === "all" || 
      (categoryFilter === "uncategorized" && (!opinion.categoryId || opinion.categoryId.trim() === "")) ||
      opinion.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    const statusMap: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
      clustered: "secondary",
    };
    return statusMap[status] || "outline";
  };

  const getStatusLabel = (status: string): string => {
    const labelMap: Record<string, string> = {
      pending: "대기 중",
      approved: "승인됨",
      rejected: "거부됨",
      clustered: "클러스터링됨",
    };
    return labelMap[status] || status;
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="의견 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="select-status-filter">
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="pending">대기 중</SelectItem>
              <SelectItem value="approved">승인됨</SelectItem>
              <SelectItem value="rejected">거부됨</SelectItem>
              <SelectItem value="clustered">클러스터링됨</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger data-testid="select-category-filter">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              <SelectItem value="uncategorized">미분류</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-12">
          <p className="text-center text-muted-foreground">로딩 중...</p>
        </Card>
      ) : filteredOpinions.length === 0 ? (
        <Card className="p-12">
          <p className="text-center text-muted-foreground">의견이 없습니다</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>내용</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>좋아요</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpinions.map((opinion) => (
                <TableRow key={opinion.id} data-testid={`opinion-row-${opinion.id}`}>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="line-clamp-2">{opinion.content}</p>
                      {opinion.voiceUrl && (
                        <Badge variant="outline" className="mt-1 text-xs gap-1">
                          <MessageSquare className="w-3 h-3" />
                          음성
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {categories.find((c) => c.id === opinion.categoryId)?.name || "미분류"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(opinion.status)}>
                      {getStatusLabel(opinion.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{opinion.likes}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {opinion.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: opinion.id, status: "approved" })
                            }
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-approve-${opinion.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: opinion.id, status: "rejected" })
                            }
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-reject-${opinion.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/opinion/${opinion.id}`, "_blank")}
                        data-testid={`button-view-${opinion.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(opinion.id)}
                        disabled={deleteMutation.isPending}
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
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {filteredOpinions.length}개의 의견
        </p>
      </div>
    </div>
  );
}
