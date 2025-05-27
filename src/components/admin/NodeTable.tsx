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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
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
  GripVertical,
  Pencil,
  Trash2,
  Terminal,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ClientFormData {
  name: string;
  token: string;
  remark: string;
  public_remark: string;
}

export const schema = z.object({
  uuid: z.string(),
  name: z.string(),
  cpu_name: z.string().optional(),
  arch: z.string().optional(),
  cpu_cores: z.number().optional(),
  os: z.string().optional(),
  gpu_name: z.string().optional(),
  ipv4: z.string(),
  ipv6: z.string().optional(),
  region: z.string().optional(),
  mem_total: z.number().optional(),
  swap_total: z.number().optional(),
  disk_total: z.number().optional(),
  version: z.string(),
  weight: z.number().optional(),
  price: z.number().optional(),
  expired_at: z.string().optional(),
  CreatedAt: z.string().optional(),
  UpdatedAt: z.string().optional(),
});

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <GripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}
function EditDialog({ item }: { item: z.infer<typeof schema> }) {
  const [form, setForm] = React.useState({
    token: "",
    remark: "",
    public_remark: "",
    name: item.name || "",
    weight: item.weight || 0,
  });
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // 新增：用于刷新数据的回调
  const refreshTable = React.useContext(DataTableRefreshContext);

  React.useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch(`/api/admin/client/${item.uuid}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setForm((f) => ({
            ...f,
            token: data.token || "",
          }));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [item.uuid]);

  function saveClientData(
    uuid: string,
    form: ClientFormData,
    setLoading: (b: boolean) => void,
    onSuccess?: () => void
  ) {
    setLoading(true);
    fetch(`/api/admin/client/${uuid}/edit`, {
      method: "POST",
      body: JSON.stringify(form),
    })
      .then(() => {
        if (onSuccess) {
          onSuccess();
        }
        // 保存成功后刷新表格数据
        if (refreshTable) refreshTable();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="编辑">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑信息</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-1">名称</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="请输入名称"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1">Token 令牌</label>
            <Input
              value={form.token}
              onChange={(e) =>
                setForm((f) => ({ ...f, token: e.target.value }))
              }
              placeholder="请输入 Token"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1">私有备注</label>
            <Textarea
              value={form.remark}
              onChange={(e) =>
                setForm((f) => ({ ...f, remark: e.target.value }))
              }
              placeholder="请输入私有备注"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1">公开备注</label>
            <Textarea
              value={form.public_remark}
              onChange={(e) =>
                setForm((f) => ({ ...f, public_remark: e.target.value }))
              }
              placeholder="请输入公开备注"
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full"
            onClick={() =>
              saveClientData(item.uuid, form, setLoading, () => setOpen(false))
            }
            disabled={loading}
          >
            {loading ? "等待..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.uuid,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// 用于跨组件刷新表格的上下文
const DataTableRefreshContext = React.createContext<null | (() => void)>(null);

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[];
}) {
  const [data, setData] = React.useState(() =>
    [...initialData].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
  );
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

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ uuid }) => uuid) || [],
    [data]
  );

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
        setData((data) => {
          const oldIndex = dataIds.indexOf(active.id as string);
          const newIndex = dataIds.indexOf(over.id as string);
          const newData = arrayMove(data, oldIndex, newIndex);

          // 重新生成 weight
          const updatedData = newData.map((item, index) => ({
            ...item,
            weight: -index, // 从 0 开始重新设置 weight
          }));

          // 构造 { uuid: weight } 对象
          const orderObj = updatedData.reduce((acc, cur) => {
            acc[cur.uuid] = cur.weight;
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
    fetch("/api/admin/client/list")
      .then((res) => res.json())
      .then((list) =>
        setData([...list].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)))
      );
  }, []);

  return (
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
                        No results.
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
  );
}

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>机器详细信息</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-ip">IP 地址</Label>
                <div className="flex flex-col gap-1">
                  {item.ipv4 && (
                    <div className="flex items-center gap-1">
                      <div
                        id="detail-ipv4"
                        className="bg-muted px-3 py-2 rounded border flex-1"
                      >
                        {item.ipv4}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.ipv4!);
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  )}
                  {item.ipv6 && (
                    <div className="flex items-center gap-1">
                      <div
                        id="detail-ipv6"
                        className="bg-muted px-3 py-2 rounded border flex-1"
                      >
                        {item.ipv6}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.ipv6!);
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-version">客户端版本</Label>
                <div
                  id="detail-version"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.version || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-os">操作系统</Label>
                <div
                  id="detail-os"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.os || <span className="text-muted-foreground">-</span>}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-arch">架构</Label>
                <div
                  id="detail-arch"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.arch || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-cpu_name">CPU</Label>
                <div
                  id="detail-cpu_name"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.cpu_name || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-cpu_cores">CPU 核心数</Label>
                <div
                  id="detail-cpu_cores"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.cpu_cores || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-mem_total">总内存 (Bytes)</Label>
                <div
                  id="detail-mem_total"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.mem_total || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-disk_total">总磁盘空间 (Bytes)</Label>
                <div
                  id="detail-disk_total"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.disk_total || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="detail-gpu_name">GPU</Label>
              <div
                id="detail-gpu_name"
                className="bg-muted px-3 py-2 rounded border"
              >
                {item.gpu_name || (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="detail-uuid">UUID</Label>
              <div
                id="detail-uuid"
                className="bg-muted px-3 py-2 rounded border"
              >
                {item.uuid || <span className="text-muted-foreground">-</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-createdAt">创建时间</Label>
                <div
                  id="detail-createdAt"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.CreatedAt ? (
                    new Date(item.CreatedAt).toLocaleString()
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-updatedAt">更新时间</Label>
                <div
                  id="detail-updatedAt"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.UpdatedAt ? (
                    new Date(item.UpdatedAt).toLocaleString()
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
