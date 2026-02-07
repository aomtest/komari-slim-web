import { LiveDataProvider } from "@/contexts/LiveDataContext";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import { Outlet } from "react-router-dom";
import { NodeListProvider } from "@/contexts/NodeListContext";
import { usePublicInfo } from "@/contexts/PublicInfoContext";

const IndexLayout = () => {
  // 使用我们的LiveDataContext
  const InnerLayout = () => {
    const { publicInfo } = usePublicInfo();
    const bgUrl = publicInfo?.theme_settings?.backgroundImageUrl;
    return (
      <>
        <div
          className={
            bgUrl
              ? "layout flex flex-col w-full min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
              : "layout flex flex-col w-full min-h-screen bg-accent-1"
          }
          style={{
            backgroundImage: bgUrl ? `url(${bgUrl})` : "none",
          }}
        >
          <NavBar />
          <main className="main-content m-1 h-full">
            <Outlet />
          </main>
          <Footer />
        </div>
      </>
    );
  };

  return (
    <LiveDataProvider>
      <NodeListProvider>
        <InnerLayout />
      </NodeListProvider>
    </LiveDataProvider>
  );
};

export default IndexLayout;
