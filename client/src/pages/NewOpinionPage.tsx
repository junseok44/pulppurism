import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageSquare, Mic } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function NewOpinionPage() {
  const [, setLocation] = useLocation();
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleTextSubmit = () => {
    if (content.trim()) {
      console.log("Opinion submitted:", content);
      setLocation("/opinions");
    }
  };

  const handleVoiceInput = () => {
    setIsRecording(true);
    console.log("Voice recording started");
    // todo: remove mock functionality - implement actual voice recording
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
                의견 내용
              </label>
              <Textarea
                id="opinion-textarea"
                placeholder="지역사회 개선을 위한 의견을 자유롭게 작성해주세요. 구체적으로 작성하실수록 더 좋은 논의가 이루어질 수 있습니다."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-48"
                disabled={isRecording}
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
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleTextSubmit}
                disabled={!content.trim() || isRecording}
                data-testid="button-submit"
              >
                게시하기
              </Button>
            </div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
