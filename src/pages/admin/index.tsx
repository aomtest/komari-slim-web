import React, { useState } from "react";
import {
  NodeDetailsProvider,
  useNodeDetails,
  type NodeDetail,
} from "@/contexts/NodeDetailsContext";
import {
  Flex,
  TextField,
  Button,
  Checkbox,
  Text,
  Dialog,
} from "@radix-ui/themes";
import { MenuIcon, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import Flag from "@/components/Flag";
import { Table,TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const NodeDetailsPage = () => {
  return (
    <NodeDetailsProvider>
      <Layout />
    </NodeDetailsProvider>
  );
};

const Layout = () => {
  const { t } = useTranslation();
  const { nodeDetail, isLoading, error } = useNodeDetails();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const filteredNodes = nodeDetail
    .filter((node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.weight - b.weight);

  if (isLoading) return <div>{t("loading")}</div>;
  if (error) return <div>{error}</div>;

  return (
    <Flex direction="column" gap="4" p="4">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedNodes={selectedNodes}
      />
      <NodeTable
        nodes={filteredNodes}
        selectedNodes={selectedNodes}
        setSelectedNodes={setSelectedNodes}
      />
    </Flex>
  );
};

const Header = ({
  searchTerm,
  setSearchTerm,
  selectedNodes,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedNodes: string[];
}) => {
  const { t } = useTranslation();
  const { refresh } = useNodeDetails();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleAddNode = async (name: string | undefined) => {
    setDialogOpen(true);
    setLoading(true);
    try {
      await fetch("/api/admin/client/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "" }),
      });
      refresh();
    } catch (error) {
      toast.error(
        `${t("error", "Error")}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
      setDialogOpen(false);
    }
  };
  return (
    <Flex justify="between" align="center" gap="4">
      <Flex gap="2" align="center">
        <Text size="5" weight="bold">
          {t("admin.nodeTable.nodeList")}
        </Text>
        {selectedNodes.length > 0 && (
          <Text size="2">({selectedNodes.length} selected)</Text>
        )}
      </Flex>
      <Flex gap="2">
        <TextField.Root
          placeholder={t("admin.nodeTable.searchByName")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={16} />
              {t("admin.nodeTable.addNode")}
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>{t("admin.nodeTable.addNode")}</Dialog.Title>
            <TextField.Root
              ref={inputRef}
              placeholder={t("admin.nodeTable.nameOptional")}
            />
            <Flex justify="end" gap="2" mt="4">
              <Button
                onClick={() => handleAddNode(inputRef.current?.value)}
                disabled={loading}
              >
                {t("admin.nodeTable.addNode")}
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </Flex>
  );
};

const SortableRow = ({
  node,
  selectedNodes,
  handleSelectNode,
}: {
  node: NodeDetail;
  selectedNodes: string[];
  handleSelectNode: (uuid: string, checked: boolean) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: node.uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="hover:bg-accent-a2">
      <TableCell>
        <label {...attributes} {...listeners}>
          <MenuIcon size={16} color="var(--gray-8)" />
        </label>
      </TableCell>
      <TableCell>
        <Checkbox
          checked={selectedNodes.includes(node.uuid)}
          onCheckedChange={(checked) => handleSelectNode(node.uuid, !!checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Flag flag={node.region} />
          {node.name}
        </div>
      </TableCell>
      <TableCell>
        <Flex direction="column">
          <Text size="2">{node.ipv4}</Text>
          <Text size="2">{node.ipv6}</Text>
        </Flex>
      </TableCell>
      <TableCell>{node.version}</TableCell>
      <TableCell>
        <Text
          size="2"
          title={node.remark}
          style={{
            maxWidth: "150px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.remark}
        </Text>
      </TableCell>
      <TableCell>{/* Action buttons placeholder */}</TableCell>
    </TableRow>
  );
};

const NodeTable = ({
  nodes,
  selectedNodes,
  setSelectedNodes,
}: {
  nodes: NodeDetail[];
  selectedNodes: string[];
  setSelectedNodes: (nodes: string[]) => void;
}) => {
  const { t } = useTranslation();
  const sensors = useSensors(useSensor(PointerSensor));

  // 添加 localNodes 状态，实现即时 UI 更新
  const [localNodes, setLocalNodes] = useState<NodeDetail[]>(nodes);
  React.useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localNodes.findIndex((node) => node.uuid === active.id);
    const newIndex = localNodes.findIndex((node) => node.uuid === over.id);
    const reorderedNodes = Array.from(localNodes);
    const [reorderedItem] = reorderedNodes.splice(oldIndex, 1);
    reorderedNodes.splice(newIndex, 0, reorderedItem);

    // 立即更新 UI
    setLocalNodes(reorderedNodes);

    try {
      const orderData = reorderedNodes.reduce((acc, node, index) => {
        acc[node.uuid] = index;
        return acc;
      }, {} as Record<string, number>);

      await fetch("/api/admin/client/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      // 不再调用 refresh，以免覆盖本地排序
    } catch (error) {
      toast.error("Order Failed");
    }
  };

  // 更新全选逻辑，使用 localNodes
  const handleSelectAll = (checked: boolean) => {
    setSelectedNodes(checked ? localNodes.map((node) => node.uuid) : []);
  };

  const handleSelectNode = (uuid: string, checked: boolean) => {
    setSelectedNodes(
      checked
        ? [...selectedNodes, uuid]
        : selectedNodes.filter((id) => id !== uuid)
    );
  };

  return (
    <div className="rounded-md overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader style={{ backgroundColor: "var(--accent-4)" }}>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>
                <Checkbox
                  checked={
                    selectedNodes.length === localNodes.length &&
                    localNodes.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                {t("admin.nodeTable.name")}
              </TableHead>
              <TableHead>
                {t("admin.nodeTable.ipAddress")}
              </TableHead>
              <TableHead>
                {t("admin.nodeTable.clientVersion")}
              </TableHead>
              <TableHead>
                {t("admin.nodeEdit.remark")}
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={localNodes.map((node) => node.uuid)}
              strategy={verticalListSortingStrategy}
            >
              {localNodes.map((node) => (
                <SortableRow
                  key={node.uuid}
                  node={node}
                  selectedNodes={selectedNodes}
                  handleSelectNode={handleSelectNode}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
};

export default NodeDetailsPage;