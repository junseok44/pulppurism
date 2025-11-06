import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";

export default function NewAgendaForm() {
  const [files, setFiles] = useState<string[]>([]);

  const handleAddFile = () => {
    setFiles([...files, `파일${files.length + 1}.pdf`]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">새 안건 생성</h2>
        <p className="text-muted-foreground">
          새로운 안건을 생성하고 관련 정보를 입력합니다
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              안건 제목 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="안건 제목을 입력하세요"
              data-testid="input-title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              카테고리 <span className="text-destructive">*</span>
            </label>
            <Select>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="care">돌봄</SelectItem>
                <SelectItem value="medical">의료</SelectItem>
                <SelectItem value="environment">환경</SelectItem>
                <SelectItem value="education">교육</SelectItem>
                <SelectItem value="life">생활</SelectItem>
                <SelectItem value="traffic">교통</SelectItem>
                <SelectItem value="economy">경제</SelectItem>
                <SelectItem value="culture">문화</SelectItem>
                <SelectItem value="politics">정치</SelectItem>
                <SelectItem value="administration">행정</SelectItem>
                <SelectItem value="welfare">복지</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              안건 개요 <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="안건에 대한 설명을 입력하세요"
              className="min-h-32"
              data-testid="input-description"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">연결된 클러스터</label>
            <Select>
              <SelectTrigger data-testid="select-cluster">
                <SelectValue placeholder="클러스터를 선택하세요 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cluster1">
                  초등학교 통학로 안전 (15개 의견)
                </SelectItem>
                <SelectItem value="cluster2">
                  도서관 운영 시간 연장 (12개 의견)
                </SelectItem>
                <SelectItem value="cluster3">
                  공원 소음 문제 (8개 의견)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">상태</label>
            <Select defaultValue="review">
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="review">검토 중</SelectItem>
                <SelectItem value="progress">진행 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="hold">보류</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">대표 이미지</label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                클릭하여 이미지 업로드
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">참고 자료</label>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleAddFile}
                data-testid="button-add-file"
              >
                <Upload className="w-4 h-4 mr-2" />
                파일 추가
              </Button>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      data-testid={`file-${index}`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{file}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(index)}
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">외부 링크</label>
            <Input
              placeholder="관련 웹사이트 URL을 입력하세요"
              data-testid="input-link"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" data-testid="button-cancel">
          취소
        </Button>
        <Button data-testid="button-submit">안건 생성</Button>
      </div>
    </div>
  );
}
