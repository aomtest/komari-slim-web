import { Flex } from "@radix-ui/themes";
import { Outlet } from "react-router-dom";

export default function SettingLayout() {
  return (
    <Flex direction="column" gap="3" className="p-4">
      <Outlet />
    </Flex>
  );
}
