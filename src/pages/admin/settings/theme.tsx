import { useTranslation } from "react-i18next";
import {
  Text,
  Card,
  Button,
  Grid,
  Box,
  Flex,
  Dialog,
  Badge,
  IconButton,
} from "@radix-ui/themes";
import { useState, useEffect, useRef } from "react";
import { Upload, Settings, Image as ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/loading";
import { useSettings } from "@/lib/api";

interface Theme {
  id: string;
  name: string;
  short: string;
  description: string;
  author: string;
  version: string;
  preview?: string;
  active: boolean;
  createdAt: string;
}

const ThemePage = () => {
  const { t } = useTranslation();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themesLoading, setThemesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadXhr, setUploadXhr] = useState<XMLHttpRequest | null>(null);
  const [settingTheme, setSettingTheme] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [themeToUpdate, setThemeToUpdate] = useState<Theme | null>(null);
  const [themeUrl, setThemeUrl] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings, loading: settingsLoading, refetch: refetchSettings } = useSettings();
  const currentTheme = settings?.theme;

  const loading = themesLoading || settingsLoading || !currentTheme;
  // 获取主题列表
  const fetchThemes = async () => {
    try {
      const response = await fetch("/api/admin/theme/list");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const themeList = data.data || [];

      // 确保始终有默认主题
      let hasDefaultTheme = themeList.some(
        (theme: Theme) => theme.short === "default"
      );
      if (!hasDefaultTheme) {
        themeList.unshift({
          id: "default",
          name: t("theme.default_theme"),
          short: "default",
          description: t("theme.default_description"),
          author: "Akizon77",
          version: "1.0.0",
          preview: "/assets/edit_117847723_p0.png",
          active: currentTheme === "default",
          createdAt: new Date().toISOString(),
        });
      }

      // 根据 settings 中的 theme 设置活跃状态
      const updatedThemes = themeList.map((theme: Theme) => ({
        ...theme,
        active: theme.short === currentTheme,
      }));

      setThemes(updatedThemes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch themes");
    } finally {
      setThemesLoading(false);
    }
  };

  // 上传主题
  const uploadTheme = async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      toast.error(t("theme.invalid_file_type"));
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      setUploadXhr(xhr);

      // 监听上传进度
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      // 监听请求完成
      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // 检查响应是否成功
            JSON.parse(xhr.responseText);
            toast.success(t("theme.upload_success"));
            setUploadDialogOpen(false);
            setUploadProgress(0);
            await fetchThemes();
            resolve();
          } catch (err) {
            toast.error(t("theme.upload_failed") + ": Parse error");
            reject(err);
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            throw new Error(errorData.message || "Upload failed");
          } catch (err) {
            toast.error(
              t("theme.upload_failed") +
                ": " +
                (err instanceof Error ? err.message : "Unknown error")
            );
            reject(err);
          }
        }
        setUploading(false);
        setUploadXhr(null);
      });

      // 监听错误
      xhr.addEventListener("error", () => {
        toast.error(t("theme.upload_failed") + ": Network error");
        setUploading(false);
        setUploadProgress(0);
        setUploadXhr(null);
        reject(new Error("Network error"));
      });

      // 监听中断
      xhr.addEventListener("abort", () => {
        toast.error(t("theme.upload_failed") + ": Upload cancelled");
        setUploading(false);
        setUploadProgress(0);
        setUploadXhr(null);
        reject(new Error("Upload cancelled"));
      });

      // 发送请求
      xhr.open("PUT", "/api/admin/theme/upload");
      xhr.send(formData);
    });
  };

  // 取消上传
  const cancelUpload = () => {
    if (uploadXhr) {
      uploadXhr.abort();
    }
  };

  // 设置主题
  const setActiveTheme = async (themeShort: string) => {
    try {
      setSettingTheme(themeShort);

      // 先调用 API 设置主题
      const response = await fetch(`/api/admin/theme/set?theme=${themeShort}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 刷新 settings 以获取最新的主题设置
      await refetchSettings();

      // 更新主题列表中的活跃状态
      setThemes((prevThemes) =>
        prevThemes.map((theme) => ({
          ...theme,
          active: theme.short === themeShort,
        }))
      );

      toast.success(t("theme.set_success"));
    } catch (err) {
      toast.error(
        t("theme.set_failed") +
          ": " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setSettingTheme(null);
    }
  };

  // 更新主题
  const updateTheme = async (themeShort: string, url: string) => {
    try {
      setUpdating(true);
      
      const response = await fetch("/api/admin/theme/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ short: themeShort, url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Update failed");
      }

      // 重新获取主题列表
      await fetchThemes();

      setUpdateDialogOpen(false);
      setPreviewDialogOpen(false);
      toast.success(t("theme.update_success"));
    } catch (err) {
      toast.error(
        t("theme.update_failed") +
          ": " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setUpdating(false);
    }
  };

  // 删除主题
  const deleteTheme = async (themeShort: string) => {
    try {
      // 如果删除的是当前活跃主题，先切换到默认主题
      if (themeShort === currentTheme) {
        await setActiveTheme("default");
        await refetchSettings();
      }

      const response = await fetch("/api/admin/theme/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ short: themeShort }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Delete failed");
      }

      // 重新获取主题列表
      await fetchThemes();

      setDeleteDialogOpen(false);
      setPreviewDialogOpen(false);
      toast.success(t("theme.delete_success"));
    } catch (err) {
      toast.error(
        t("theme.delete_failed") +
          ": " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  // 文件拖拽处理
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find((file) => file.name.endsWith(".zip"));
    if (zipFile) {
      uploadTheme(zipFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadTheme(file);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, [currentTheme]); // 依赖 currentTheme，当主题变化时重新获取列表

  // 当 settings 加载完成且主题列表已存在时，同步活跃状态
  useEffect(() => {
    if (!settingsLoading && themes.length > 0) {
      setThemes((prevThemes) =>
        prevThemes.map((theme) => ({
          ...theme,
          active: theme.short === currentTheme,
        }))
      );
    }
  }, [currentTheme, settingsLoading, themes.length]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  return (
    <Box className="p-6 space-y-6">
      <Flex justify="between" align="center">
        <Text size="6" weight="bold">
          {t("theme.title")}
        </Text>
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
          <Upload size={16} />
          {t("theme.upload")}
        </Button>
      </Flex>

      {/* 主题卡片网格 */}
      {themes.length === 0 ? (
        <Box className="text-center py-12">
          <ImageIcon size={64} className="mx-auto text-gray-400 mb-4" />
          <Text size="4" color="gray" className="mb-2">
            {t("theme.no_themes")}
          </Text>
          <Text size="2" color="gray">
            {t("theme.upload_first_theme")}
          </Text>
        </Box>
      ) : (
        <Grid columns={{ initial: "1", sm: "2", md: "3", lg: "4" }} gap="4">
          {themes.map((theme) => (
            <Card
              key={theme.id}
              className="relative group hover:shadow-lg transition-all duration-200"
            >
              <Box
                onClick={() => {
                  setPreviewDialogOpen(true);
                  setSelectedTheme(theme);
                }}
                className="aspect-video bg-gradient-to-br rounded-t-lg overflow-hidden relative "
              >
                {theme.preview ? (
                  <img
                    src={
                      theme.short === "default"
                        ? "/assets/edit_117847723_p0.png"
                        : `/themes/${theme.short}/${theme.preview}`
                    }
                    alt={theme.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}
                <Flex
                  align="center"
                  justify="center"
                  className={`w-full h-full ${
                    theme.preview && theme.short !== "default" ? "hidden" : ""
                  }`}
                >
                  <ImageIcon size={48} className="text-gray-400" />
                </Flex>
                {/* 覆盖层 */}
                <Box className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <Flex gap="2">
                    {/* <Button
                      size="2"
                      variant="solid"
                      onClick={() => {
                        setSelectedTheme(theme);
                        setPreviewDialogOpen(true);
                      }}
                    >
                      <Eye size={16} />
                    </Button> */}
                    {/* {theme.short !== "default" && (
                      <Button
                        size="2"
                        variant="solid"
                        color="red"
                        onClick={() => {
                          setThemeToDelete(theme);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )} */}
                  </Flex>
                </Box>

                {/* 活跃状态指示器 */}
                {theme.active && (
                  <Badge
                    color="green"
                    className="absolute top-2 right-2 px-2 py-1 text-xs"
                  >
                    {t("theme.active")}
                  </Badge>
                )}
              </Box>

              <Flex
                onClick={() => {
                  setPreviewDialogOpen(true);
                  setSelectedTheme(theme);
                }}
                direction="column"
                className="p-4 space-y-2"
              >
                <Text weight="bold" size="3">
                  {theme.name}
                </Text>
                <Flex justify="between" align="center">
                  <Text size="1" color="gray">
                    by {theme.author}
                  </Text>
                  <Text size="1" color="gray">
                    v{theme.version}
                  </Text>
                </Flex>
              </Flex>
              <Flex justify="end" align="center">
                {!theme.active && (
                  <IconButton
                    size="2"
                    variant="ghost"
                    onClick={() => setActiveTheme(theme.short)}
                    disabled={settingTheme === theme.short}
                  >
                    {settingTheme === theme.short ? (
                      <Box className="animate-spin">
                        <Settings size={16} />
                      </Box>
                    ) : (
                      <Settings size={16} />
                    )}
                  </IconButton>
                )}
              </Flex>
            </Card>
          ))}
        </Grid>
      )}

      {/* 上传对话框 */}
      <Dialog.Root open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>{t("theme.upload_theme")}</Dialog.Title>
          <Dialog.Description>
            {t("theme.upload_description")}
          </Dialog.Description>

          <Box className="space-y-4 mt-4">
            <Flex
              direction="column"
              align="center"
              justify="center"
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <Text size="3" weight="medium">
                {t("theme.drag_drop")}
              </Text>
              <Text size="2" color="gray" className="mt-2">
                {t("theme.or_click_to_browse")}
              </Text>
              <Text size="1" color="gray" className="mt-2">
                {t("theme.zip_files_only")}
              </Text>
            </Flex>

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Box>
          {/* 上传状态提示 */}
          {uploading && (
            <Box className="flex items-center justify-center z-50">
              <Card className="p-6 text-center min-w-80 max-w-md">
                <Text size="3" className="mt-2 mb-4">
                  {t("theme.uploading")}
                </Text>

                {/* 进度条容器 */}
                <Box className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
                  <Box
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {/* 进度条光泽效果 */}
                    <Box className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </Box>
                </Box>

                <Flex justify="between" align="center" className="mb-4">
                  <Text size="2" color="gray">
                    {Math.round(uploadProgress)}%
                  </Text>
                </Flex>

                {/* 取消按钮 */}
                <Button
                  variant="soft"
                  color="gray"
                  onClick={cancelUpload}
                  disabled={uploadProgress >= 100}
                >
                  {t("common.cancel")}
                </Button>
              </Card>
            </Box>
          )}
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                {t("common.cancel")}
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* 预览对话框 */}
      <Dialog.Root open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <Dialog.Content maxWidth="800px">
          <Dialog.Title>{selectedTheme?.name}</Dialog.Title>

          <Box className="space-y-4 mt-4">
            <Box className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
              {selectedTheme?.preview && selectedTheme.short !== "default" ? (
                <img
                  src={`/themes/${selectedTheme.short}/${selectedTheme.preview}`}
                  alt={selectedTheme.name}
                  className="w-full h-full object-cover"
                />
              ) : selectedTheme?.short === "default" ? (
                <img
                  src={`/assets/edit_117847723_p0.png`}
                  alt={selectedTheme.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Flex align="center" justify="center" className="w-full h-full">
                  <ImageIcon size={64} className="text-gray-400" />
                </Flex>
              )}
            </Box>

            <Flex direction="column">
              <Flex gap="2" justify="start" align="center">
                <Text size="2" weight="bold" color="gray">
                  {t("theme.author")}
                </Text>
                <Text size="3">{selectedTheme?.author}</Text>
              </Flex>
              <Flex gap="2" justify="start" align="center">
                <Text size="2" weight="bold" color="gray">
                  {t("theme.version")}
                </Text>
                <Text size="3">{selectedTheme?.version}</Text>
              </Flex>
              <Flex gap="2" justify="start" align="center">
                <Text size="2" weight="bold" color="gray">
                  {t("theme.description")}
                </Text>
                <Text size="3">{selectedTheme?.description}</Text>
              </Flex>
            </Flex>
          </Box>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                {t("common.close")}
              </Button>
            </Dialog.Close>
            {selectedTheme && !selectedTheme.active && (
              <Button
                onClick={() => {
                  setActiveTheme(selectedTheme.short);
                  setPreviewDialogOpen(false);
                }}
              >
                {t("theme.set_active")}
              </Button>
            )}
            {selectedTheme && selectedTheme.short !== "default" && (
              <Button
                variant="soft"
                color="blue"
                onClick={() => {
                  setThemeToUpdate(selectedTheme);
                  setThemeUrl("");
                  setUpdateDialogOpen(true);
                }}
                className="gap-2"
              >
                <RefreshCw size={16} />
                {t("theme.update")}
              </Button>
            )}
            {selectedTheme && selectedTheme.short !== "default" && (
              <Button
                size="2"
                variant="solid"
                color="red"
                onClick={() => {
                  setThemeToDelete(selectedTheme);
                  setDeleteDialogOpen(true);
                }}
              >
                {t("common.delete")}
              </Button>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* 删除确认对话框 */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Content maxWidth="400px">
          <Dialog.Title>{t("theme.confirm_delete")}</Dialog.Title>
          <Dialog.Description>
            {t("theme.delete_warning", { themeName: themeToDelete?.name })}
          </Dialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                {t("common.cancel")}
              </Button>
            </Dialog.Close>
            <Button
              color="red"
              onClick={async () => {
                if (themeToDelete) {
                  await deleteTheme(themeToDelete.short);
                  setDeleteDialogOpen(false);
                  setThemeToDelete(null);
                }
              }}
            >
              {t("common.delete")}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* 更新主题对话框 */}
      <Dialog.Root open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>{t("theme.update_theme")}</Dialog.Title>
          <Dialog.Description>
            {t("theme.update_description")}
          </Dialog.Description>
          
          <Box className="space-y-4 mt-4">
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                {t("theme.theme_url")}
              </Text>
              <input
                type="text"
                value={themeUrl}
                onChange={(e) => setThemeUrl(e.target.value)}
                placeholder={t("theme.theme_url_placeholder")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Text size="1" color="gray">
                {t("theme.theme_url_description")}
              </Text>
            </Flex>
          </Box>
          
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                {t("common.cancel")}
              </Button>
            </Dialog.Close>
            <Button
              color="blue"
              disabled={!themeUrl.trim() || updating}
              onClick={async () => {
                if (themeToUpdate && themeUrl.trim()) {
                  await updateTheme(themeToUpdate.short, themeUrl.trim());
                  setUpdateDialogOpen(false);
                  setThemeToUpdate(null);
                  setThemeUrl("");
                }
              }}
            >
              {updating ? (
                <Box className="animate-spin mr-2">
                  <RefreshCw size={16} />
                </Box>
              ) : null}
              {t("theme.update")}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default ThemePage;
