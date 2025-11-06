import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function CategoryManagement() {
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // todo: remove mock functionality
  const categories = [
    { id: "1", name: "돌봄", agendaCount: 8, order: 1, color: "#3b82f6" },
    { id: "2", name: "의료", agendaCount: 5, order: 2, color: "#ef4444" },
    { id: "3", name: "환경", agendaCount: 12, order: 3, color: "#10b981" },
    { id: "4", name: "교육", agendaCount: 15, order: 4, color: "#f59e0b" },
    { id: "5", name: "생활", agendaCount: 20, order: 5, color: "#8b5cf6" },
    { id: "6", name: "교통", agendaCount: 18, order: 6, color: "#06b6d4" },
    { id: "7", name: "경제", agendaCount: 7, order: 7, color: "#84cc16" },
    { id: "8", name: "문화", agendaCount: 10, order: 8, color: "#ec4899" },
    { id: "9", name: "정치", agendaCount: 3, order: 9, color: "#6366f1" },
    { id: "10", name: "행정", agendaCount: 6, order: 10, color: "#14b8a6" },
    { id: "11", name: "복지", agendaCount: 9, order: 11, color: "#f97316" },
  ];

  const handleEdit = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setEditDialog(true);
  };

  const handleDelete = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setDeleteDialog(true);
  };

  const handleMoveUp = (categoryId: string) => {
    console.log("Move up", categoryId);
  };

  const handleMoveDown = (categoryId: string) => {
    console.log("Move down", categoryId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">카테고리 관리</h2>
          <p className="text-muted-foreground">
            안건 카테고리를 생성, 수정, 삭제하고 순서를 변경합니다
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)} data-testid="button-create-category">
          <Plus className="w-4 h-4 mr-2" />
          새 카테고리 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category, index) => (
          <Card key={category.id} className="p-4" data-testid={`category-${category.id}`}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveUp(category.id)}
                  disabled={index === 0}
                  data-testid={`button-move-up-${category.id}`}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveDown(category.id)}
                  disabled={index === categories.length - 1}
                  data-testid={`button-move-down-${category.id}`}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              <GripVertical className="w-5 h-5 text-muted-foreground" />

              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: category.color }}
              />

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{category.name}</h3>
                  <Badge variant="secondary">{category.agendaCount}개 안건</Badge>
                </div>
                <p className="text-sm text-muted-foreground">순서: {category.order}</p>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(category.id)}
                  data-testid={`button-edit-${category.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(category.id)}
                  data-testid={`button-delete-${category.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent data-testid="dialog-create-category">
          <DialogHeader>
            <DialogTitle>새 카테고리 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리 이름</label>
              <Input
                placeholder="카테고리 이름을 입력하세요"
                data-testid="input-category-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">색상</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  defaultValue="#3b82f6"
                  className="w-20 h-10"
                  data-testid="input-category-color"
                />
                <Input
                  placeholder="#3b82f6"
                  data-testid="input-category-color-hex"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialog(false)}
              data-testid="button-cancel-create"
            >
              취소
            </Button>
            <Button data-testid="button-confirm-create">추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent data-testid="dialog-edit-category">
          <DialogHeader>
            <DialogTitle>카테고리 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리 이름</label>
              <Input
                placeholder="카테고리 이름을 입력하세요"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">색상</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  defaultValue="#3b82f6"
                  className="w-20 h-10"
                  data-testid="input-edit-color"
                />
                <Input
                  placeholder="#3b82f6"
                  data-testid="input-edit-color-hex"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog(false)}
              data-testid="button-cancel-edit"
            >
              취소
            </Button>
            <Button data-testid="button-confirm-edit">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent data-testid="dialog-delete-category">
          <DialogHeader>
            <DialogTitle>카테고리 삭제</DialogTitle>
            <DialogDescription>
              이 카테고리를 삭제하시겠습니까? 이미 사용 중인 카테고리는 삭제할 수
              없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(false)}
              data-testid="button-cancel-delete"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              data-testid="button-confirm-delete"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
