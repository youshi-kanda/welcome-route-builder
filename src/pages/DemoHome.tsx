import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DemoHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🛡️ ALSOK Demo System
            </h1>
            <p className="text-gray-600">
              完全な採用ワークフローをデモンストレーション
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <Button
              onClick={() => navigate("/admin")}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              PC管理画面
            </Button>
            
            <Button
              onClick={() => navigate("/phone")}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              電話受付
            </Button>
            
            <Button
              onClick={() => navigate("/mobile")}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              モバイル申込
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            ※ 現在開発機能です。完全なデモにはQRコードから各機能にアクセスします。
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoHome;