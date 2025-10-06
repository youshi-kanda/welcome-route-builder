import { ja } from "@/i18n/ja";

export const Footer = () => {
  return (
    <footer className="mt-auto border-t bg-muted py-6">
      <div className="container px-4 sm:px-6">
        <div className="flex flex-col gap-4 text-center text-xs text-muted-foreground">
          <p className="leading-relaxed">
            {ja.home.footerNote}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="#" 
              className="transition-base hover:text-primary"
              aria-label="利用規約"
            >
              利用規約
            </a>
            <a 
              href="#" 
              className="transition-base hover:text-primary"
              aria-label="プライバシーポリシー"
            >
              プライバシーポリシー
            </a>
            <a 
              href="#" 
              className="transition-base hover:text-primary"
              aria-label="お問い合わせ"
            >
              お問い合わせ
            </a>
          </div>
          <p className="text-[10px]">
            © 2025 ALSOK. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
