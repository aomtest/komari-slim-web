import React, { useEffect, useRef } from "react";
import { useNodeDetails } from "@/contexts/NodeDetailsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useTranslation } from "react-i18next";
import { Checkbox, TextField } from "@radix-ui/themes";
import { Search } from "lucide-react";

interface NodeSelectorProps {
  className?: string;
  hiddenDescription?: boolean;
  value: string[]; // uuid 列表
  onChange: (uuids: string[]) => void;
}

const NodeSelector: React.FC<NodeSelectorProps> = ({
  className = "",
  hiddenDescription = false,
  value,
  onChange,
}) => {
  value = value ?? [];

  const { nodeDetail, isLoading, error } = useNodeDetails();
  const { t } = useTranslation();
  const [search, setSearch] = React.useState("");

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }

  // 排序和搜索
  const filtered = [...nodeDetail]
    .sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
    .filter((node) => node.name.toLowerCase().includes(search.toLowerCase()));

  const allUuids = filtered.map((node) => node.uuid);
  const allChecked =
    allUuids.length > 0 && allUuids.every((uuid) => value.includes(uuid));
  const isIndeterminate = value.length > 0 && value.length < allUuids.length;

  // 新增：找出 value 里 nodeDetail 没有的 uuid
  const orphanUuids = value.filter(
    (uuid) => !nodeDetail.some((node) => node.uuid === uuid)
  );

  const checkAllRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (checkAllRef.current) {
      // @ts-ignore
      checkAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      onChange(Array.from(new Set([...value, ...allUuids])));
    } else {
      onChange(value.filter((id) => !allUuids.includes(id)));
    }
  };

  const handleCheck = (uuid: string, checked: boolean) => {
    if (checked) {
      onChange(Array.from(new Set([...value, uuid])));
    } else {
      onChange(value.filter((id) => id !== uuid));
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <TextField.Root
        className="mb-2 flex items-center gap-1"
        placeholder={t("common.search")}
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearch(e.target.value)
        }
      >
        <TextField.Slot>
          <Search size="16" />
        </TextField.Slot>
      </TextField.Root>
      <div className="node-selector rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableHead>
              <Checkbox
                ref={checkAllRef}
                checked={allChecked}
                onCheckedChange={(checked) => handleCheckAll(!!checked)}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>{t("common.server")}</TableHead>
          </TableHeader>
          <TableBody>
            {filtered.map((node) => (
              <TableRow key={node.id}>
                <TableCell>
                  <Checkbox
                    checked={value.includes(node.uuid)}
                    onCheckedChange={(checked) =>
                      handleCheck(node.uuid, !!checked)
                    }
                    aria-label={`Select ${node.name}`}
                  />
                </TableCell>
                <TableCell>{node.name}</TableCell>
              </TableRow>
            ))}
            {/* 新增：渲染孤立 uuid */}
            {orphanUuids.map((uuid) => (
              <TableRow key={uuid}>
                <TableCell>
                  <Checkbox
                    checked={value.includes(uuid)}
                    onCheckedChange={(checked) =>
                      handleCheck(uuid, !!checked)
                    }
                    aria-label={`Select ${uuid}`}
                  />
                </TableCell>
                <TableCell>{uuid}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!hiddenDescription && (
        <label className="text-sm text-gray-500">
          {t("common.selected", { count: value.length })}
        </label>
      )}
    </div>
  );
};

export default NodeSelector;
