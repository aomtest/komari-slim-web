import {
    SettingCardSelect,
    SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { SettingCardMultiInputCollapse } from "@/components/admin/SettingCardMultiInput";
import { toast } from "sonner";

interface RenderProviderInputsProps {
    currentProvider: string;
    providerDefs: any;
    providerValues: any;
    translationPrefix?: string;
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
                    title={String(t(`${translationPrefix}.provider_fields`))}
                    defaultOpen={true}
                    items={inputFields.map((f: any) => ({
                        tag: f.name,
                        label: String(t(`${translationPrefix}.${f.name}`, f.name)) + (f.required ? " *" : ""),
                        type: f.type === "int" ? "short" : "short", // 可以根据需要调整
                        defaultValue: providerValues[f.name] || f.default || "",
                        required: f.required,
                        number: f.type === "int",
                    }))}
                    onSave={async (values: any) => {
                        // 验证必填字段
                        const requiredFields = inputFields.filter((f: any) => f.required);
                        const missingFields = requiredFields.filter((f: any) => !values[f.name] || values[f.name].trim() === "");

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
                            if (f.type === "int" && processedValues[f.name] !== undefined && processedValues[f.name] !== "") {
                                const numValue = Number(processedValues[f.name]);
                                if (!isNaN(numValue)) {
                                    processedValues[f.name] = numValue;
                                }
                            }
                        });

                        const allValues = { ...providerValues, ...processedValues };
                        await handleSave(allValues);
                    }}
                >
                    {selectFields.map((f: any) => (
                        <SettingCardSelect
                            key={f.name}
                            bordless
                            title={String(t(`${translationPrefix}.${f.name}`, f.name))}
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