import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Mic, StopCircle, Send, Loader2, Bot, Check, Edit2 } from "lucide-react"; 
import { useState, useEffect, useRef } from "react";
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

interface Message {
  id: string;
  role: 'system' | 'user';
  text: string;
}

export default function OpinionInputSheet({ open, onOpenChange }: OpinionInputSheetProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [shouldTranscribe, setShouldTranscribe] = useState(false);
  const voiceRecorder = useVoiceRecorder();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isConfirming, setIsConfirming] = useState(false);
  const [draftContent, setDraftContent] = useState("");

  useEffect(() => {
    if (open) {
      setMessages([
        {
          id: 'welcome-1',
          role: 'system',
          text: `안녕하세요, ${user?.username || '주민'}님! 👋\n우리 마을을 위해 어떤 제안을 하고 싶으신가요?`,
        },
        {
          id: 'welcome-2',
          role: 'system',
          text: '글로 써주시거나, 말로 편하게 이야기해주시면 제가 잘 듣고 기록할게요!',
        }
      ]);
      setContent("");
      setDraftContent("");
      setIsConfirming(false);
      voiceRecorder.clearRecording();
    }
  }, [open, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isConfirming]);

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
      setContent((prev) => (prev ? prev + " " + data.text : data.text));
      toast({ title: "변환 완료", description: "음성이 텍스트로 변환되었습니다." });
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
      setMessages(prev => [
        ...prev, 
        { id: 'done', role: 'system', text: "소중한 의견 감사합니다! 주신 의견과 비슷한 목소리들이 모이면 안건으로 생성될 수 있어요." }
      ]);
      
      setTimeout(() => {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      }, 2000);
    },
    onError: () => {
      toast({ variant: "destructive", title: "제출 실패", description: "다시 시도해주세요." });
      setIsConfirming(false);
    },
  });

  const handleDraftSubmit = () => {
    if (!content.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: content.trim()
    };
    
    setMessages(prev => [
      ...prev, 
      userMsg,
      { 
        id: `confirm-${Date.now()}`, 
        role: 'system', 
        text: "작성해주신 내용이 맞나요? 아래 버튼을 눌러 등록해주세요." 
      }
    ]);

    setDraftContent(content.trim());
    setIsConfirming(true);
    setContent("");
  };

  const handleFinalSubmit = () => {
    createOpinionMutation.mutate({
      content: draftContent,
      userId: user?.id ? String(user.id) : "0",
      type: "text",
    });
  };

  const handleEdit = () => {
    setIsConfirming(false);
    setContent(draftContent);
    setMessages(prev => [
      ...prev,
      { id: `edit-${Date.now()}`, role: 'system', text: "내용을 수정해주세요." }
    ]);
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
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-ok_gray2" side="right">
        
        {/* 헤더 */}
        <SheetHeader className="px-4 py-3 bg-ok_gray1 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <SheetTitle className="text-base font-bold">두런두런 도우미</SheetTitle>
          </div>
        </SheetHeader>

        {/* 2. 채팅 영역 (여기에 배너 넣음!) */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'system' && (
                <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}

              <div 
                className={`
                  max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-ok_sand text-ok_txtgray2 rounded-tr-none' 
                    : 'bg-ok_gray1 text-ok_txtgray2 rounded-tl-none border border-gray-100'}
                `}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* ✨ [위치 이동] 음성 입력 배너: 채팅 메시지들 바로 아래에 배치! */}
          {!isConfirming && !voiceRecorder.isRecording && (
            <div className="py-2 pl-10 pr-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Button
                variant="ghost"
                className="w-full h-14 rounded-2xl bg-primary/5 hover:bg-primary/10 text-primary gap-2 transition-all hover:scale-[1.01] shadow-sm"
                onClick={handleStartRecording}
                disabled={transcribeMutation.isPending}
              >
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <Mic className="w-5 h-5 text-primary" />
                </div>
                <span className="font-bold text-base">당신의 목소리를 들려주세요</span>
              </Button>
            </div>
          )}

          {/* 전송 로딩 표시 */}
          {createOpinionMutation.isPending && (
            <div className="flex justify-end gap-3">
              <div className="bg-ok_sand text-ok_txtgray2 px-4 py-2 rounded-2xl rounded-tr-none text-sm flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> 등록 중...
              </div>
            </div>
          )}
        </div>

        {/* 3. 하단 입력창 영역 (배너 제거하고 입력창만 남김) */}
        <div className="bg-ok_gray1 p-3">
          
          {isConfirming ? (
            // 확인 모드 버튼
            <div className="flex gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <Button 
                variant="ghost" 
                className="flex-1 h-12 rounded-xl text-base gap-2 hover:bg-gray-50"
                onClick={handleEdit}
                disabled={createOpinionMutation.isPending}
              >
                <Edit2 className="w-4 h-4" /> 수정하기
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl text-base gap-2 bg-primary hover:bg-primary/90"
                onClick={handleFinalSubmit}
                disabled={createOpinionMutation.isPending}
              >
                {createOpinionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                등록하기
              </Button>
            </div>
          ) : (
            // 일반 입력 모드
            <>
              {voiceRecorder.isRecording ? (
                 <div className="flex items-center justify-between bg-red-50 rounded-full px-4 py-2 animate-pulse border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      <span className="font-bold text-red-600">{formatTime(voiceRecorder.recordingTime)}</span>
                      <span className="text-sm text-red-400">듣고 있어요...</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={handleStopRecording} 
                      className="rounded-full h-8 px-4"
                    >
                      <StopCircle className="w-4 h-4 mr-1" /> 완료
                    </Button>
                 </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="relative flex-1 bg-ok_gray2 rounded-[20px] px-4 py-2 transition-all">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="텍스트로 입력하기..."
                      className="min-h-[24px] max-h-[100px] w-full border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 resize-none leading-6 placeholder:text-ok_txtgray0"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleDraftSubmit(); 
                        }
                      }}
                    />
                  </div>

                  <Button
                    size="icon"
                    className={`flex-shrink-0 rounded-full w-10 h-10 mb-1 transition-all ${
                      content.trim() ? "bg-primary hover:bg-primary/90" : "bg-gray-200 text-gray-400 hover:bg-gray-200"
                    }`}
                    onClick={handleDraftSubmit}
                    disabled={!content.trim()}
                  >
                    {transcribeMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>
                </div>
              )}
              
              {transcribeMutation.isPending && (
                 <div className="text-xs text-center text-primary mt-2 flex items-center justify-center gap-1">
                   <Loader2 className="w-3 h-3 animate-spin" />
                   음성을 글로 바꾸고 있어요...
                 </div>
              )}
            </>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}