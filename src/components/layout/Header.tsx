import { Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ja } from "@/i18n/ja";

export const Header = () => {
  const location = useLocation();
  const isAdmin = location.pathname === "/admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <Link 
          to="/" 
          className="flex items-center gap-2 transition-base hover:opacity-80"
          aria-label="ホームに戻る"
        >
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">
            {ja.common.appTitle}
          </span>
        </Link>

        {!isAdmin && (
          <Link
            to="/admin"
            className="text-sm font-medium text-muted-foreground transition-base hover:text-primary"
            aria-label="管理画面へ"
          >
            {ja.common.admin}
          </Link>
        )}
      </div>
    </header>
  );
};
