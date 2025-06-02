import React from "react";
import {
  TablerServer,
  TablerAdjustments,
  TablerUsers,
  TablerUserCircle,
  TablerBook2,
  TablerSettings2,
  TablerHome,
  TablerCode,
  TablerCircleArrowDownRight,
  TablerDots,
} from "@/components/Icones/Tabler";

// Map icon names defined in menuConfig.json to their components
export const iconMap: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  TablerServer,
  TablerAdjustments,
  TablerUsers,
  TablerUserCircle,
  TablerBook2,
  TablerSettings2,
  TablerHome,
  TablerCode,
  TablerCircleArrowDownRight,
  TablerDots
};
