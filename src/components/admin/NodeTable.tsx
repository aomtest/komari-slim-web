import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { z } from "zod";

import { EditDialog } from "./NodeTable/NodeEditDialog";
import { TableCellViewer } from "./NodeTable/NodeDetailViewer";
import { DragHandle, DraggableRow } from "./NodeTable/NodeTableDndComponents";

import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  Columns2,
  Copy,
  Trash2,
  Terminal,
  PlusIcon,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { schema } from "./NodeTable/schema/node";
import { DataTableRefreshContext } from "./NodeTable/schema/DataTableRefreshContext";
import { t } from "i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "../ui/input";

async function removeClient(uuid: string) {
  await fetch(`/api/admin/client/${uuid}/remove`, {
    method: "POST",
  });
}

function ActionsCell({ row }: { row: Row<z.infer<typeof schema>> }) {
  const refreshTable = React.useContext(DataTableRefreshContext);
  const [removing, setRemoving] = React.useState(false);

  return (
    <div className="flex gap-2 justify-center">
      <Button
        variant="ghost"
        size="icon"
        aria-label="终端"
        onClick={() =>
          window.open(`/terminal?uuid=${row.original.uuid}`, "_blank")
        }
      >
        <Terminal />
      </Button>
      <EditDialog item={row.original} />
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="删除"
            className="text-destructive"
          >
            <Trash2 />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div>这个操作将无法恢复！</div>
          <DialogFooter>
            <Button variant="outline" asChild>
              <DialogTrigger>取消</DialogTrigger>
            </Button>
            <Button
              variant="destructive"
              disabled={removing}
              onClick={async () => {
                setRemoving(true);
                await removeClient(row.original.uuid);
                setRemoving(false);
                if (refreshTable) refreshTable();
              }}
              asChild
            >
              <DialogTrigger>{removing ? "删除中..." : "确认"}</DialogTrigger>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.uuid} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllRowsSelected() ||
            (table.getIsSomeRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "名称",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "ipv4",
    header: "IP 地址",
    cell: ({ row }) => {
      const ipv4 = row.original.ipv4;
      const ipv6 = row.original.ipv6;
      return (
        <div className="flex flex-col gap-1 min-w-80">
          {ipv4 && (
            <div className="flex items-center gap-1">
              <span>{ipv4}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={() => {
                  navigator.clipboard.writeText(ipv4);
                }}
              >
                <Copy size={16} />
              </Button>
            </div>
          )}
          {ipv6 && (
            <div className="flex items-center gap-1">
              <span>{ipv6}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={() => {
                  navigator.clipboard.writeText(ipv6);
                }}
              >
                <Copy size={16} />
              </Button>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "version",
    header: "客户端版本",
    cell: ({ row }) => <div className="w-32">{row.getValue("version")}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];

export function DataTable() {
  const [data, setData] = React.useState<z.infer<typeof schema>[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );
  const isMobile = useIsMobile();
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ uuid }) => uuid) || [],
    [data]
  );
  const [newNodeName, setNewNodeName] = React.useState("");
  async function handleAddNode() {
    await fetch("/api/admin/client/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newNodeName }),
    });
    setNewNodeName("");
    refreshTable?.();
  }

  React.useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch("/api/admin/client/list")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((list: z.infer<typeof schema>[]) => {
        setData([...list].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)));
        setIsLoading(false);
      })
      .catch((e) => {
        console.error("Failed to fetch node list:", e);
        if (data.length > 0) setError("无法加载节点列表。");
      });
  }, [data.length]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    getRowId: (row) => row.uuid.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over) {
      if (active.id !== over.id) {
        setData((currentData) => {
          const oldIndex = currentData.findIndex(
            (item) => item.uuid === active.id
          );
          const newIndex = currentData.findIndex(
            (item) => item.uuid === over.id
          );
          if (oldIndex === -1 || newIndex === -1) return currentData;

          const newData = arrayMove(currentData, oldIndex, newIndex);

          // 重新生成 weight
          const updatedData = newData.map((item, index) => ({
            ...item,
            weight: index, // 从 0 开始重新设置 weight
          }));

          // 构造 { uuid: weight } 对象
          const orderObj = updatedData.reduce((acc, cur) => {
            acc[cur.uuid] = cur.weight!;
            return acc;
          }, {} as Record<string, number>);

          // 提交到后端
          fetch("/api/admin/client/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderObj),
          });
          console.log("提交的顺序:", JSON.stringify(orderObj));
          return updatedData;
        });
      }
    }
  }

  // 新增：刷新数据的方法
  const refreshTable = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetch("/api/admin/client/list")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((list) => {
        setData([...list].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)));
        setIsLoading(false);
      })
      .catch((e) => {
        console.error("Failed to refresh node list:", e);
        setError("刷新列表失败。");
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className="p-4 text-center">加载中...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div
      className={`
        mb-6
        ${!isMobile ? "p-4" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {t("admin.nodeList", "节点列表")}
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1" />
              {t("admin.addNode", "添加节点")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.addNode", "添加节点")}</DialogTitle>
            </DialogHeader>
            <div className="">
            <label className="block mb-1">名称 (可选)</label>
            <Input
              placeholder="Name"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
            />
            </div>
            <DialogFooter>
              <Button onClick={handleAddNode}>提交</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DataTableRefreshContext.Provider value={refreshTable}>
        <div className="w-full flex-col justify-start gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"></div>
          </div>
          <div className="relative flex flex-col gap-4 overflow-auto">
            <div className="overflow-hidden rounded-lg">
              <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
                sensors={sensors}
                id={sortableId}
              >
                <Table>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id} colSpan={header.colSpan}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody className="**:data-[slot=table-cell]:first:w-8">
                    {table.getRowModel().rows?.length ? (
                      <SortableContext
                        items={dataIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {table.getRowModel().rows.map((row) => (
                          <DraggableRow key={row.id} row={row} />
                        ))}
                      </SortableContext>
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          {data.length === 0 && !isLoading
                            ? "没有数据。"
                            : "No results."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground flex-1 text-sm">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns2 />
                    <span className="hidden lg:inline">自定义列</span>
                    <span className="lg:hidden"></span>
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {table
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !== "undefined" &&
                        column.getCanHide()
                    )
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </DataTableRefreshContext.Provider>
    </div>
  );
}
