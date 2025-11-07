import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Mic } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, InsertOpinion } from "@shared/schema";

export default function NewOpinionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createOpinionMutation = useMutation({
    mutationFn: async (data: InsertOpinion) => {
      const response = await apiRequest("POST", "/api/opinions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      toast({
        title: "의견이 제출되었습니다",
        description: "관리자 검토 후 안건으로 전환될 수 있습니다.",
      });
      setLocation("/opinions");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "제출 실패",
        description: "의견 제출 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    },
  });

  const handleTextSubmit = () => {
    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "내용을 입력해주세요",
        description: "의견 내용은 필수 항목입니다.",
      });
      return;
    }

    if (!categoryId) {
      toast({
        variant: "destructive",
        title: "카테고리를 선택해주세요",
        description: "의견 카테고리는 필수 항목입니다.",
      });
      return;
    }

    createOpinionMutation.mutate({
      content: content.trim(),
      categoryId,
      userId: "temp-user-id",
      type: "text",
    });
  };

  const handleVoiceInput = () => {
    setIsRecording(true);
    toast({
      title: "음성 녹음 시작",
      description: "음성 녹음 기능은 향후 업데이트될 예정입니다.",
    });
    setTimeout(() => {
      setIsRecording(false);
      setContent("음성으로 입력된 내용입니다. 실제 구현 시 음성 인식 API를 사용합니다.");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">의견 제안하기</h1>
            <p className="text-muted-foreground">
              지역사회 개선을 위한 의견을 자유롭게 제안해주세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`p-6 cursor-pointer hover-elevate active-elevate-2 ${
                !isRecording ? "" : "opacity-50"
              }`}
              onClick={() => !isRecording && document.getElementById("opinion-textarea")?.focus()}
              data-testid="card-text-input"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">민원 혹은 제안 입력하기</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    키보드로 의견을 작성합니다
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className={`p-6 cursor-pointer hover-elevate active-elevate-2 ${
                isRecording ? "border-2 border-primary" : ""
              }`}
              onClick={handleVoiceInput}
              data-testid="card-voice-input"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isRecording ? "bg-destructive/10" : "bg-primary/10"
                }`}>
                  <Mic className={`w-6 h-6 ${isRecording ? "text-destructive" : "text-primary"}`} />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {isRecording ? "녹음 중..." : "음성으로 입력하기"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRecording ? "말씀해주세요" : "음성으로 의견을 제안합니다"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                카테고리
              </label>
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

            <div>
              <label className="block text-sm font-medium mb-2">
                의견 내용
              </label>
              <Textarea
                id="opinion-textarea"
                placeholder="지역사회 개선을 위한 의견을 자유롭게 작성해주세요. 구체적으로 작성하실수록 더 좋은 논의가 이루어질 수 있습니다."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-48"
                disabled={isRecording || createOpinionMutation.isPending}
                data-testid="input-opinion-content"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {content.length}자
              </p>
            </div>

            {content.trim() && (
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium text-sm mb-2">작성 전 확인사항</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 구체적인 문제 상황이 포함되어 있나요?</li>
                  <li>• 불필요한 욕설이나 비방이 없나요?</li>
                  <li>• 개인정보가 포함되지 않았나요?</li>
                </ul>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocation("/opinions")}
                disabled={createOpinionMutation.isPending}
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleTextSubmit}
                disabled={!content.trim() || !categoryId || isRecording || createOpinionMutation.isPending}
                data-testid="button-submit"
              >
                {createOpinionMutation.isPending ? "제출 중..." : "게시하기"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
