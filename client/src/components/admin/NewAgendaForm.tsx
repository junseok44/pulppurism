import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import type { Category, Cluster } from "@shared/schema";

export default function NewAgendaForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [clusterId, setClusterId] = useState("");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const urlClusterId = urlParams.get('clusterId');

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: clusters = [] } = useQuery<Cluster[]>({
    queryKey: ["/api/clusters"],
  });

  const { data: selectedCluster, isLoading: clusterLoading } = useQuery<Cluster>({
    queryKey: ["/api/clusters", urlClusterId],
    enabled: !!urlClusterId,
  });

  useEffect(() => {
    console.log("URL Cluster ID:", urlClusterId);
    console.log("Selected Cluster:", selectedCluster);
    console.log("Cluster Loading:", clusterLoading);
    
    if (selectedCluster) {
      console.log("Setting title to:", selectedCluster.title);
      console.log("Setting description to:", selectedCluster.summary);
      setTitle(selectedCluster.title);
      setDescription(selectedCluster.summary);
      setClusterId(selectedCluster.id);
    }
  }, [selectedCluster, urlClusterId, clusterLoading]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const res = await apiRequest("POST", "/api/agendas", {
        title,
        description,
        categoryId,
        status: "active",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const agenda = await res.json();

      if (clusterId && clusterId !== "none") {
        await apiRequest("PATCH", `/api/clusters/${clusterId}`, {
          agendaId: agenda.id,
        });
      }

      return agenda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agendas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clusters"] });
      toast({
        title: "안건 생성 완료",
        description: "새로운 안건이 성공적으로 생성되었습니다.",
      });
      setLocation("/admin/agendas/all");
    },
    onError: () => {
      toast({
        title: "안건 생성 실패",
        description: "안건 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !categoryId) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">새 안건 생성</h2>
        <p className="text-muted-foreground">
          새로운 안건을 생성합니다. 투표 기간은 14일로 자동 설정됩니다.
          {urlClusterId && ` (클러스터: ${urlClusterId})`}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                안건 제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="안건 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cluster">
                클러스터 선택 (선택사항)
              </Label>
              <Select value={clusterId || undefined} onValueChange={(val) => setClusterId(val || "")}>
                <SelectTrigger data-testid="select-cluster">
                  <SelectValue placeholder="클러스터를 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">클러스터 없음</SelectItem>
                  {clusters
                    .filter(c => !c.agendaId)
                    .map((cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                카테고리 <span className="text-destructive">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                안건 설명 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="안건에 대한 상세 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                data-testid="textarea-description"
              />
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/agendas")}
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "안건 생성"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
