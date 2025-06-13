import {
  CommandClipboardProvider,
  useCommandClipboard,
  type CommandClipboard,
} from "@/contexts/CommandClipboardContext";
import { useTerminal } from "@/contexts/TerminalContext";
import {
  Button,
  Card,
  Code,
  Dialog,
  Flex,
  IconButton,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { PlusIcon, Trash2Icon, Edit2Icon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

const CommandClipboardPanel = ({ ...props }: { [key: string]: any }) => {
  const InnerLayout = () => {
    const { commands, loading, error } = useCommandClipboard();
    if (loading) {
      return <div>Loading commands...</div>;
    }
    if (error) {
      return <div>Error loading commands: {error.message}</div>;
    }
    return (
      <Flex
        {...props}
        direction="column"
        gap="2"
        overflowX={"clip"}
        overflowY={"scroll"}
        style={{ height: "100%" }}
        className="command-clipboard-container"
      >
        <Flex>
          <label className="text-lg font-semibold">命令剪切板</label>
        </Flex>
        <AddButton />
        {commands.map((item) => (
          <CommandCard key={item.id} {...item} />
        ))}
      </Flex>
    );
  };
  return (
    <CommandClipboardProvider>
      <InnerLayout />
    </CommandClipboardProvider>
  );
};

const AddButton = () => {
  const [isOpen, setOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const { addCommand } = useCommandClipboard();
  const handleAddCommand = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const text = formData.get("text") as string;
    const markup = formData.get("markup") as string;

    try {
      setAdding(true);
      await addCommand(name, text, markup);
      setOpen(false);
      toast.success("命令已添加");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setAdding(false);
    }
  };
  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton aria-label="Add Command">
          <PlusIcon size="16" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>添加命令</Dialog.Title>
        <form onSubmit={handleAddCommand}>
          <Flex direction="column" gap="2">
            <label htmlFor="name">命令名称</label>
            <TextField.Root
              id="name"
              name="name"
              defaultValue={Math.random().toString(36).substring(7)}
            />
            <label htmlFor="text">内容</label>
            <TextArea id="text" name="text" />
            <label htmlFor="markup">备注</label>
            <TextField.Root id="markup" name="markup" />
            <Button type="submit" variant="solid" disabled={adding}>
              添加
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

// DeleteButton: 删除命令
const DeleteButton = ({ id }: { id: number }) => {
  const { deleteCommand } = useCommandClipboard();
  const [isOpen, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteCommand(id);
      toast.success("命令已删除");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton aria-label="Delete Command" color="red">
          <Trash2Icon size="16" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>删除</Dialog.Title>
        <Dialog.Description>确定删除此命令吗？</Dialog.Description>
        <Flex justify="end" gap="2" className="mt-4">
          <Dialog.Close>
            <Button>取消</Button>
          </Dialog.Close>
          <Button onClick={handleDelete} disabled={deleting} color="red">
            删除
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

// EditButton: 编辑命令
const EditButton = ({ id, name, text, remark }: CommandClipboard) => {
  const { updateCommand } = useCommandClipboard();
  const [isOpen, setOpen] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const newName = formData.get("name") as string;
    const newText = formData.get("text") as string;
    const newRemark = formData.get("remark") as string;
    try {
      setUpdating(true);
      await updateCommand(id, newName, newText, newRemark);
      setOpen(false);
      toast.success("命令已更新");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setUpdating(false);
    }
  };
  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton aria-label="Edit Command">
          <Edit2Icon size="16" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>编辑命令</Dialog.Title>
        <form onSubmit={handleUpdate}>
          <Flex direction="column" gap="2">
            <label htmlFor={`name`}>命令名称</label>
            <TextField.Root id={`name`} name="name" defaultValue={name} />
            <label htmlFor={`text`}>内容</label>
            <TextArea id={`text`} name="text" defaultValue={text} />
            <label htmlFor={`remark`}>备注</label>
            <TextField.Root id={`remark`} name="remark" defaultValue={remark} />
            <Flex justify="end" gap="2" className="mt-4">
              <Dialog.Close>
                <Button>取消</Button>
              </Dialog.Close>
              <Button type="submit" disabled={updating}>
                更新
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

const CommandCard = (item: CommandClipboard) => {
  const { sendCommand } = useTerminal();
  return (
    <Flex key={item.id} direction="column">
      <Card>
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center">
            <label className="text-lg font-semibold">{item.name}</label>
            <Button onClick={() => sendCommand(item.text)}>执行</Button>
          </Flex>
          <Code className="command-text" style={{ whiteSpace: "pre-wrap" }}>
            {item.text.length > 300 ? item.text.substring(0, 300) + `\n...(其他${item.text.length - 300}个字符)` : item.text}
          </Code>
          <Flex justify="end" gap="2">
            <EditButton {...item} />
            <DeleteButton id={item.id} />
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
};

export default CommandClipboardPanel;
