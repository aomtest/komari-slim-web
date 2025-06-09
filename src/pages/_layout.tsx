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
        <div
          style={{
            backgroundColor: "var(--accent-1)",
          }}
          className="flex justify-center w-full"
        >
          <div className="flex flex-col md:mx-4 w-full h-full">
            <NavBar />
            <main
              className="m-1"
              style={{
                flex: 1,
                minHeight: 0,
              }}
            >
              <Outlet />
              <Footer />
            </main>
          </div>
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
