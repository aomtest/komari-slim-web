import React from "react";
import {
  TablerServer,
} from "@/components/Icones/Tabler";
import * as LucideIcons from "lucide-react";
// Map icon names defined in menuConfig.json to their components
export const iconMap: Record<
  string,
  React.ComponentType<any>
> = {
  TablerServer,
  ...Object.fromEntries(
    Object.entries(LucideIcons).filter(([key]) => key !== 'createLucideIcon')
  ),
};
