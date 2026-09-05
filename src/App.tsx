import { useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Home } from "./pages/Home";
import { Browse } from "./pages/Browse";
import { Search } from "./pages/Search";
import { Detail } from "./pages/Detail";
import { Watch } from "./pages/Watch";
import { Favorites, History } from "./pages/Library";
import { EmptyState } from "./components/ui";
import { UpdateBanner } from "./components/UpdateBanner";

/** Cuộn vô hạn khiến người dùng đi rất sâu, nên phải kéo về đầu khi đổi trang. */
function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    document.getElementById("content")?.scrollTo({ top: 0 });
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <HashRouter>
      <div className="flex h-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <UpdateBanner />
          <TopBar />
          <main id="content" className="flex-1 overflow-y-auto px-6 py-6">
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse/:kind/:slug" element={<Browse />} />
              <Route path="/tim-kiem" element={<Search />} />
              <Route path="/phim/:slug" element={<Detail />} />
              <Route path="/xem/:slug" element={<Watch />} />
              <Route path="/yeu-thich" element={<Favorites />} />
              <Route path="/lich-su" element={<History />} />
              <Route path="*" element={<EmptyState>Không tìm thấy trang này.</EmptyState>} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
}
