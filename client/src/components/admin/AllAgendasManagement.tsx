import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Agenda, Category } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Search, Eye, Edit, Trash2, Filter, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AllAgendasManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"voting" | "reviewing" | "completed">("reviewing");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: agendas = [], isLoading } = useQuery<Agenda[]>({
    queryKey: ["/api/agendas"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/agendas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agendas"] });
      toast({
        title: "안건 삭제 완료",
        description: "안건이 성공적으로 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "삭제 실패",
        description: "안건 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title?: string; description?: string; status?: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/agendas/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agendas"] });
      setEditDialogOpen(false);
      toast({
        title: "안건 수정 완료",
        description: "안건이 성공적으로 수정되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "수정 실패",
        description: "안건 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const filteredAgendas = agendas.filter((agenda) => {
    const matchesSearch = agenda.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || agenda.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || agenda.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "voting":
        return "default";
      case "reviewing":
        return "secondary";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "voting":
        return "투표중";
      case "reviewing":
        return "검토중";
      case "completed":
        return "답변 및 결과";
      default:
        return status;
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "미지정";
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("정말 이 안건을 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (agenda: Agenda) => {
    setEditingAgenda(agenda);
    setEditTitle(agenda.title);
    setEditDescription(agenda.description);
    setEditStatus(agenda.status as "voting" | "reviewing" | "completed");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingAgenda) return;
    updateMutation.mutate({
      id: editingAgenda.id,
      title: editTitle,
      description: editDescription,
      status: editStatus,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">전체 안건 관리</h2>
          <p className="text-muted-foreground">
            모든 안건을 조회하고 수정, 삭제할 수 있습니다
          </p>
        </div>
        <Button onClick={() => setLocation("/admin/agendas/new")} data-testid="button-create-agenda">
          새 안건 생성
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="안건 제목으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="voting">투표중</SelectItem>
              <SelectItem value="reviewing">검토중</SelectItem>
              <SelectItem value="completed">답변 및 결과</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40" data-testid="select-category-filter">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filteredAgendas.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "검색 조건에 맞는 안건이 없습니다"
              : "생성된 안건이 없습니다"}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead>조회수</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgendas.map((agenda) => (
                <TableRow key={agenda.id} data-testid={`agenda-row-${agenda.id}`}>
                  <TableCell className="font-medium max-w-md">
                    <div className="line-clamp-2">{agenda.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryName(agenda.categoryId)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(agenda.status)}>
                      {getStatusLabel(agenda.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(agenda.createdAt), "yyyy.MM.dd", { locale: ko })}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {agenda.viewCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/agendas/${agenda.id}`)}
                        data-testid={`button-view-${agenda.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(agenda)}
                        data-testid={`button-edit-${agenda.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(agenda.id)}
                        disabled={deleteMutation.isPending}
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
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>안건 편집</DialogTitle>
            <DialogDescription>
              안건의 제목, 내용, 상태를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="안건 제목"
                data-testid="input-edit-title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">내용</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="안건 내용"
                rows={6}
                data-testid="textarea-edit-description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상태</label>
              <Select value={editStatus} onValueChange={(val) => setEditStatus(val as "voting" | "reviewing" | "completed")}>
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voting">투표중</SelectItem>
                  <SelectItem value="reviewing">검토중</SelectItem>
                  <SelectItem value="completed">답변 및 결과</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editTitle.trim() || !editDescription.trim()}
              data-testid="button-save-edit"
            >
              {updateMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
