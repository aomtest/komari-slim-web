import { Callout, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import { Outlet } from "react-router-dom";
import { LiveDataProvider, useLiveData } from "../contexts/LiveDataContext";

const IndexLayout = () => {
  const [t] = useTranslation();
  const ishttps = window.location.protocol === "https:";

  // 使用我们的LiveDataContext
  const InnerLayout = () => {
    const { showCallout } = useLiveData();
    
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
              <Callout.Root m="2" hidden={ishttps} color="red">
                <Callout.Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M10.03 3.659c.856-1.548 3.081-1.548 3.937 0l7.746 14.001c.83 1.5-.255 3.34-1.969 3.34H4.254c-1.715 0-2.8-1.84-1.97-3.34zM12.997 17A.999.999 0 1 0 11 17a.999.999 0 0 0 1.997 0m-.259-7.853a.75.75 0 0 0-1.493.103l.004 4.501l.007.102a.75.75 0 0 0 1.493-.103l-.004-4.502z"
                    />
                  </svg>
                </Callout.Icon>
                <Callout.Text>
                  <Text size="2" weight="medium">
                    {t("warn_https")}
                  </Text>
                </Callout.Text>
              </Callout.Root>
              <Callout.Root
                m="2"
                hidden={showCallout}
                id="callout"
                color="tomato"
              >
                <Callout.Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M21.707 3.707a1 1 0 0 0-1.414-1.414L18.496 4.09a4.25 4.25 0 0 0-5.251.604l-1.068 1.069a1.75 1.75 0 0 0 0 2.474l3.585 3.586a1.75 1.75 0 0 0 2.475 0l1.068-1.068a4.25 4.25 0 0 0 .605-5.25zm-11 8a1 1 0 0 0-1.414-1.414l-1.47 1.47l-.293-.293a.75.75 0 0 0-1.06 0l-1.775 1.775a4.25 4.25 0 0 0-.605 5.25l-1.797 1.798a1 1 0 1 0 1.414 1.414l1.798-1.797a4.25 4.25 0 0 0 5.25-.605l1.775-1.775a.75.75 0 0 0 0-1.06l-.293-.293l1.47-1.47a1 1 0 0 0-1.414-1.414l-1.47 1.47l-1.586-1.586z"
                    />
                  </svg>
                </Callout.Icon>
                <Callout.Text>
                  <Text size="2" weight="medium">
                    {t("warn_websocket")}
                  </Text>
                </Callout.Text>
              </Callout.Root>
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
      <InnerLayout />
    </LiveDataProvider>
  );
};

export default IndexLayout;
