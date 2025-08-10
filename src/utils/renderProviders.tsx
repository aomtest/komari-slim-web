import {
    SettingCardSelect,
    SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { SettingCardMultiInputCollapse } from "@/components/admin/SettingCardMultiInput";
import type React from "react";
import { toast } from "sonner";

interface RenderProviderInputsProps {
    currentProvider: string;
    providerDefs: any;
    providerValues: any;
    translationPrefix?: string;
    title?: string;
    description?: string;
    footer?: React.ReactNode | string;
    setProviderValues: (updater: (prev: any) => any) => void;
    handleSave: (values: any) => Promise<void>;
    t: any;
}

export const renderProviderInputs = ({
    currentProvider,
    providerDefs,
    providerValues,
    translationPrefix,
    title,
    description,
    footer,
    setProviderValues,
    handleSave,
    t,
}: RenderProviderInputsProps) => {

    if (!currentProvider || !providerDefs[currentProvider]) return null;

    const fields = providerDefs[currentProvider];
    const selectFields = fields.filter((f: any) => f.type === "option" && f.options);
    const switchFields = fields.filter((f: any) => f.type === "bool");
    const inputFields = fields.filter((f: any) => f.type !== "option" && f.type !== "bool");

    return (
        <div key={currentProvider}>
            {inputFields.length > 0 && (
                <SettingCardMultiInputCollapse
                    title={title??"详情"}
                    description={description}
                    defaultOpen={true}
                    items={inputFields.map((f: any) => ({
                        tag: f.name,
                        label: String(t(`${translationPrefix}.${f.name}`, f.name)) + (f.required ? " *" : ""),
                        type: ["int", "int64", "float32", "float64"].includes(f.type) ? "short" : "short", // 数字类型使用短输入框
                        defaultValue: providerValues[f.name] || f.default || "",
                        placeholder: f.help ? String(t(`${translationPrefix}.${f.name}_help`, f.help)) : "",
                        required: f.required,
                        number: ["int", "int64", "float32", "float64"].includes(f.type),
                    }))}
                    onSave={async (values: any) => {
                        try {
                            // 验证必填字段
                            const requiredFields = inputFields.filter((f: any) => f.required);
                            const missingFields = requiredFields.filter((f: any) => !values[f.name] || (typeof values[f.name] === 'string' && values[f.name].trim() === ""));

                            if (missingFields.length > 0) {
                                const fieldNames = missingFields.map((f: any) => t(`${translationPrefix}.${f.name}`, f.name)).join(", ");
                                toast.error(
                                    t("settings.missing_required_fields", { fieldNames })
                                );
                                return;
                            }

                            // 转换数字类型字段
                            const processedValues = { ...values };
                            inputFields.forEach((f: any) => {
                                const value = processedValues[f.name];
                                
                                // 跳过未定义或null的值
                                if (value === undefined || value === null) {
                                    return;
                                }

                                if (["int", "int64"].includes(f.type)) {
                                    // 空字符串转换为0
                                    const numValue = value === "" ? 0 : Number(value);
                                    if (isNaN(numValue)) {
                                        toast.error(t("settings.invalid_number", { field: t(`${translationPrefix}.${f.name}`, f.name) }));
                                        throw new Error(`Invalid integer value for ${f.name}`);
                                    }
                                    if (!Number.isInteger(numValue)) {
                                        toast.error(t("settings.invalid_integer", { field: t(`${translationPrefix}.${f.name}`, f.name) }));
                                        throw new Error(`Value must be an integer for ${f.name}`);
                                    }
                                    processedValues[f.name] = numValue;
                                } else if (["float32", "float64"].includes(f.type)) {
                                    // 空字符串转换为0
                                    const numValue = value === "" ? 0 : Number(value);
                                    if (isNaN(numValue)) {
                                        toast.error(t("settings.invalid_number", { field: t(`${translationPrefix}.${f.name}`, f.name) }));
                                        throw new Error(`Invalid float value for ${f.name}`);
                                    }
                                    processedValues[f.name] = numValue;
                                }
                            });

                            const allValues = { ...providerValues, ...processedValues };
                            await handleSave(allValues);
                        } catch (error) {
                            // 数字转换错误已经通过 toast 显示，这里只需要阻止保存
                            console.error("Validation error:", error);
                        }
                    }}
                >
                    {selectFields.map((f: any) => (
                        <SettingCardSelect
                            key={f.name}
                            bordless
                            title={String(t(`${translationPrefix}.${f.name}`, f.name))}
                            description={String(t(`${translationPrefix}.${f.name}_help`, f.help))}
                            options={f.options.split(",").map((opt: string) => ({ value: opt, label: opt }))}
                            defaultValue={providerValues[f.name] || f.default || ""}
                            OnSave={(val: string) => setProviderValues((v: any) => ({ ...v, [f.name]: val }))}
                        />
                    ))}
                    {switchFields.map((f: any) => (
                        <SettingCardSwitch
                            bordless
                            key={f.name}
                            title={String(t(`${translationPrefix}.${f.name}`, f.name))}
                            description={String(t(`${translationPrefix}.${f.name}_help`, f.help))}
                            defaultChecked={providerValues[f.name] !== undefined ? !!providerValues[f.name] : (f.default === "true" || f.default === true)}
                            onChange={(checked: boolean) => setProviderValues((v: any) => ({ ...v, [f.name]: checked }))}
                        />
                    ))}
                    <label className="text-sm text-muted-foreground">
                        {footer}
                    </label>
                </SettingCardMultiInputCollapse>
            )}
        </div>
    );
};