import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">사용자 관리</h1>
        <p className="text-muted-foreground">
          사용자 조회, 제재, 관리자 권한을 관리합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-all-users">
          <h3 className="font-semibold text-lg mb-2">전체 사용자</h3>
          <p className="text-sm text-muted-foreground mb-4">
            가입된 모든 사용자를 조회하고 검색합니다
          </p>
          <Badge variant="secondary">1,567명</Badge>
        </Card>

        <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-sanctions">
          <h3 className="font-semibold text-lg mb-2">제재 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            문제 사용자를 정지 처리합니다
          </p>
          <Badge variant="destructive">3명 정지 중</Badge>
        </Card>

        <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-admins">
          <h3 className="font-semibold text-lg mb-2">관리자 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            관리자를 초대하거나 권한을 관리합니다
          </p>
          <Badge variant="secondary">5명</Badge>
        </Card>
      </div>
    </div>
  );
}
