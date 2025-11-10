import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Category, Agenda } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function CategoryManagement() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: agendas = [], isLoading: agendasLoading } = useQuery<Agenda[]>({
    queryKey: ["/api/agendas"],
  });

  const getAgendaCount = (categoryId: string) => {
    return agendas.filter((agenda) => agenda.categoryId === categoryId).length;
  };

  if (categoriesLoading || agendasLoading) {
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
          <h2 className="text-2xl font-bold mb-2">카테고리 관리</h2>
          <p className="text-muted-foreground">
            안건 카테고리 목록을 확인합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-6" data-testid={`category-${category.id}`}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description || "카테고리 설명 없음"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{getAgendaCount(category.id)}개 안건</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">등록된 카테고리가 없습니다</p>
        </Card>
      )}
    </div>
  );
}
