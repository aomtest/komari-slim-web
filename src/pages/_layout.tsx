import { LiveDataProvider } from "@/contexts/LiveDataContext";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import { Outlet } from "react-router-dom";
import { NodeListProvider } from "@/contexts/NodeListContext";

const IndexLayout = () => {
  // 使用我们的LiveDataContext
  const InnerLayout = () => {
    return (
      <>
        <div className="flex flex-col w-full min-h-screen">
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
