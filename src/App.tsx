import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DemoHome from "./pages/DemoHome";
import DemoPhone from "./pages/DemoPhone";
import DemoMobile from "./pages/DemoMobile";
import DemoAdmin from "./pages/DemoAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ALSOK デモシステム */}
          <Route path="/" element={<DemoHome />} />
          <Route path="/phone" element={<DemoPhone />} />
          <Route path="/mobile" element={<DemoMobile />} />
          <Route path="/admin" element={<DemoAdmin />} />
          
          {/* 404エラーページ */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;