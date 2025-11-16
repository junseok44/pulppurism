import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImportArticlesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    importedOpinions?: number;
    importedComments?: number;
    message?: string;
    error?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "파일 선택 필요",
        description: "먼저 JSON 파일을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      setResult(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const articles = JSON.parse(content);

          const response = await apiRequest("POST", "/api/admin/import-articles", {
            articles,
          });

          const data = await response.json();

          setResult(data);
          toast({
            title: "임포트 완료",
            description: data.message,
          });
        } catch (error) {
          console.error("Import error:", error);
          setResult({
            success: false,
            error: "임포트 중 오류가 발생했습니다.",
          });
          toast({
            title: "임포트 실패",
            description: "데이터 임포트 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        } finally {
          setImporting(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "파일 읽기 실패",
          description: "파일을 읽을 수 없습니다.",
          variant: "destructive",
        });
        setImporting(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("File read error:", error);
      setImporting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">옥천신문 게시물 임포트</h1>

      <Alert className="mb-6" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>주의</AlertTitle>
        <AlertDescription>
          이 작업은 기존의 모든 클러스터와 주민의견 데이터를 삭제합니다. 
          임포트 후에는 복구할 수 없으니 신중하게 진행해주세요.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>JSON 파일 업로드</CardTitle>
          <CardDescription>
            옥천신문 게시물 데이터가 포함된 JSON 파일을 선택하세요.
            게시물은 주민의견으로, 댓글은 답글로 변환됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90"
              data-testid="input-file-upload"
            />
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                선택된 파일: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
            data-testid="button-import"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                임포트 중...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                데이터 임포트 시작
              </>
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {result.success ? "임포트 성공" : "임포트 실패"}
              </AlertTitle>
              <AlertDescription>
                {result.success ? (
                  <div>
                    <p>{result.message}</p>
                    <ul className="mt-2 list-disc list-inside">
                      <li>주민의견: {result.importedOpinions}개</li>
                      <li>댓글: {result.importedComments}개</li>
                    </ul>
                  </div>
                ) : (
                  <p>{result.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>데이터 형식</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            JSON 파일은 다음과 같은 형식이어야 합니다:
          </p>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`[
  {
    "게시물 제목": "제목",
    "게시물 작성자": "작성자명",
    "게시물 작성 일시": "2025-11-08 19:55:53",
    "게시물 조회수": 225,
    "게시물 내용": "게시물 내용...",
    "댓글": [
      {
        "댓글 작성자": "댓글작성자",
        "댓글 작성 일시": "2025-11-08 21:47:47",
        "댓글 내용": "댓글 내용...",
        "댓글 좋아요": 2,
        "댓글 싫어요": 1
      }
    ]
  }
]`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
