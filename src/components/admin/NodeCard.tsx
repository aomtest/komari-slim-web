import {
  Card,
  Flex,
  Text,
  IconButton,
  AlertDialog,
  Button,
  Dialog,
  TextField,
} from "@radix-ui/themes";
import { Pencil1Icon, CopyIcon } from "@radix-ui/react-icons";
import type { NodeInfo } from "../../types/admin/NodeInfo";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface NodeCardProps {
  data: NodeInfo;
}

interface TokenResponse {
  token: string;
}

const NodeCard = ({ data }: NodeCardProps) => {
  const [t] = useTranslation();
  const [token, setToken] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function copy(content: string) {
    navigator.clipboard.writeText(content);
  }

  async function loadToken() {
    if (!token && !isLoading) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/client/${data.uuid}`);
        const responseData: TokenResponse = await response.json();
        setToken(responseData.token);
      } catch (error) {
        console.error('Failed to load token:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }

  function edit() {
    fetch(`/api/admin/client/${data.uuid}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        token: token,
        markup: data.markup,
      }),
    }).then((res) => {
      if (res.status === 200) {
        window.location.reload();
      }
    });
  }

  return (
    <Card className="ml-auto mr-auto w-full max-w-5xl p-6">
      <Flex
        direction={{ initial: "column", md: "row" }}
        gap="6"
        align={{ initial: "start", md: "start" }}
        justify="between"
      >
        {/* Name Section */}
        <Flex direction="column" gap="2" className="sm:w-[160px]">
          <Text size="2" weight="bold">
            {t("name")}
          </Text>
          <Text size="2">{data.name}</Text>
        </Flex>

        {/* IP Section */}
        <Flex direction="column" gap="2" className="sm:w-[200px]">
          <Text size="2" weight="bold">
            {t("ip_address")}
          </Text>
          <Text size="2">
            {data.ipv4}
            <IconButton ml="2" variant="ghost" onClick={() => copy(data.ipv4)}>
              <CopyIcon />
            </IconButton>
          </Text>
          {data.ipv6 && (
            <Text size="2">
              {data.ipv6}
              <IconButton
                ml="2"
                variant="ghost"
                onClick={() => copy(data.ipv6)}
              >
                <CopyIcon />
              </IconButton>
            </Text>
          )}
        </Flex>
        {/* ddns Section */}
        <Flex direction="column" gap="2" className="sm:w-[100px]">
          <Text size="2" weight="bold">
            DDNS
          </Text>
          <Text size="2">{t("not_implemented")}</Text>
        </Flex>
        {/* Version Section */}
        <Flex direction="column" gap="2" className="sm:w-[100px]">
          <Text size="2" weight="bold">
            {t("client_version")}
          </Text>
          <Text size="2">{data.version}</Text>
        </Flex>
        {/* markup Section */}
        <Flex direction="column" gap="2" className="sm:w-[100px]">
          <Text size="2" weight="bold">
            {t("markup")}
          </Text>
          <Text size="2">{data.markup}</Text>
        </Flex>
      </Flex>

      {/* Action Buttons */}
      <Flex
        gap="2"
        justify={{ initial: "start", md: "end" }}
        align="center"
        mt="4"
      >
        {/** Edit Button */}
        <Dialog.Root open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (open) loadToken();
        }}>
          <Dialog.Trigger>
            <Button variant="surface">
              <Pencil1Icon />
            </Button>
          </Dialog.Trigger>
          <Dialog.Content maxWidth="450px">
            <Dialog.Title>{t('edit')}</Dialog.Title>
            <Flex gap="3" direction="column" justify="start">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  {t("name")}
                </Text>
                <TextField.Root defaultValue={data.name} onChange={(e) => data.name = e.target.value}></TextField.Root>
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  {t("token")}
                </Text>
                <TextField.Root 
                  defaultValue={token} 
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                  placeholder={isLoading ? t('loading') : ''}
                ></TextField.Root>
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  {t("markup")}
                </Text>
                <TextField.Root defaultValue={data.markup} onChange={(e) => data.markup = e.target.value}></TextField.Root>
              </label>
              <Button onClick={() => edit()} disabled={isLoading}>
                {t('save')}
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
        {/** Delete Button */}
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button color="red">{t("delete")}</Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="450px">
            <AlertDialog.Title>Delete client</AlertDialog.Title>
            <AlertDialog.Description size="2" mb="4">
              Are you sure? {data.name} will be deleted.
            </AlertDialog.Description>

            <Flex gap="3" justify="end" align="center">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button variant="solid" color="red">
                  Delete
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </Flex>
    </Card>
  );
};

export default NodeCard;
