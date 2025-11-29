import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MessageSquare, Mic, StopCircle, Play, Pause, Loader2, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/useUser";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { trackOpinionCreated } from "@/lib/analytics";
import type { InsertOpinion } from "@shared/schema";

interface OpinionInputSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OpinionInputSheet({ open, onOpenChange }: OpinionInputSheetProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [shouldTranscribe, setShouldTranscribe] = useState(false);
  const voiceRecorder = useVoiceRecorder();

  // 팝업이 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setContent("");
      voiceRecorder.clearRecording();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (voiceRecorder.audioUrl) {
        URL.revokeObjectURL(voiceRecorder.audioUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (shouldTranscribe && voiceRecorder.audioBlob) {
      transcribeMutation.mutate(voiceRecorder.audioBlob);
      setShouldTranscribe(false);
    }
  }, [shouldTranscribe, voiceRecorder.audioBlob]);

  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-recording.webm");
      
      const response = await fetch("/api/opinions/transcribe", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Transcription failed");
      return response.json();
    },
    onSuccess: (data) => {
      // 기존 내용 뒤에 이어붙이기
      setContent((prev) => (prev ? prev + " " + data.text : data.text));
      toast({
        title: "변환 완료",
        description: "음성이 텍스트로 변환되었습니다.",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "변환 실패", description: "오류가 발생했습니다." });
    },
  });

  const createOpinionMutation = useMutation({
    mutationFn: async (data: InsertOpinion) => {
      const response = await apiRequest("POST", "/api/opinions", data);
      return response.json();
    },
    onSuccess: () => {
      trackOpinionCreated("text");
      toast({ title: "제출 완료", description: "소중한 의견 감사합니다!" });
      onOpenChange(false); // 성공 시 팝업 닫기
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] }); // 목록 새로고침
    },
    onError: () => {
      toast({ variant: "destructive", title: "제출 실패", description: "다시 시도해주세요." });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    createOpinionMutation.mutate({
      content: content.trim(),
      userId: user?.id ? String(user.id) : "0", // user check logic is handled in parent or server
      type: "text",
    });
  };

  const handleStartRecording = async () => {
    try {
      await voiceRecorder.startRecording();
    } catch (error) {
      toast({ variant: "destructive", title: "마이크 오류", description: "권한을 확인해주세요." });
    }
  };

  const handleStopRecording = () => {
    setShouldTranscribe(true);
    voiceRecorder.stopRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white" side="right">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="text-2xl font-bold">의견 제안하기 💬</SheetTitle>
          <SheetDescription>
            음성이나 텍스트로 자유롭게 의견을 남겨주세요.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* 1. 입력 방식 선택 (작은 카드 형태) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2 text-center border border-gray-100">
              <MessageSquare className="w-6 h-6 text-primary" />
              <span className="text-xs font-bold text-gray-600">키보드 입력</span>
            </div>
            
            <div 
              onClick={voiceRecorder.isRecording ? handleStopRecording : handleStartRecording}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 text-center border cursor-pointer transition-all ${
                voiceRecorder.isRecording 
                  ? "bg-red-50 border-red-200 animate-pulse" 
                  : "bg-blue-50 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <Mic className={`w-6 h-6 ${voiceRecorder.isRecording ? "text-red-500" : "text-blue-500"}`} />
              <span className={`text-xs font-bold ${voiceRecorder.isRecording ? "text-red-600" : "text-blue-600"}`}>
                {voiceRecorder.isRecording ? "녹음 중지" : "음성 입력"}
              </span>
            </div>
          </div>

          {/* 2. 녹음 상태 표시 */}
          {voiceRecorder.isRecording && (
            <Card className="p-4 bg-red-50 border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="font-mono font-bold text-red-600">{formatTime(voiceRecorder.recordingTime)}</span>
                </div>
                <div className="flex gap-2">
                  {voiceRecorder.isPaused ? (
                    <Button size="icon" variant="ghost" onClick={voiceRecorder.resumeRecording} className="h-8 w-8">
                      <Play className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={voiceRecorder.pauseRecording} className="h-8 w-8">
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={handleStopRecording} className="h-8 w-8 text-red-600">
                    <StopCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* 3. 변환 로딩 */}
          {transcribeMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>음성을 텍스트로 변환하고 있어요...</span>
            </div>
          )}

          {/* 4. 텍스트 입력 영역 */}
          <div className="relative">
            <Textarea
              placeholder="여기에 의견을 입력하거나, 위의 마이크 버튼을 눌러 말씀해주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none p-4 text-base rounded-2xl bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {content.length}자
            </div>
          </div>

          {/* 5. 제출 버튼 */}
          <Button 
            className="w-full h-12 text-lg font-bold rounded-xl shadow-md gap-2"
            onClick={handleSubmit}
            disabled={!content.trim() || createOpinionMutation.isPending || voiceRecorder.isRecording}
          >
            {createOpinionMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            의견 등록하기
          </Button>

          {/* 안내 메시지 */}
          <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 space-y-1">
            <p className="font-bold mb-1">💡 작성 팁</p>
            <p>• 구체적인 문제 상황을 이야기해주시면 좋아요.</p>
            <p>• 비방이나 욕설은 관리자에 의해 삭제될 수 있어요.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}