import React, { useEffect, useMemo, useState } from 'react';
import { Flex, Heading, Text, Callout, Separator, Code, Button, Spinner } from '@radix-ui/themes';
import { usePublicInfo } from '@/contexts/PublicInfoContext';
import { SettingCardSelect, SettingCardSwitch, SettingCardShortTextInput } from '@/components/admin/SettingCard';
import { toast } from 'sonner';

interface ThemeFieldBase {
    name?: string; // 显示名
    help?: string; // 帮助文本
    type: 'title' | 'switch' | 'select' | 'number' | 'string';
    key?: string; // 对应设置键（title 无需）
    default?: any; // 默认值
    options?: string; // 仅 select 支持，逗号分隔
    required?: boolean;
}

interface ThemeConfigResponse {
    configuration?: {
        data?: ThemeFieldBase[];
    };
    [k: string]: any;
}

const ThemeManaged: React.FC = () => {
    const { publicInfo, refresh } = usePublicInfo();
    const theme = publicInfo?.theme;
    const themeSettings = publicInfo?.theme_settings || {}; // 当前值

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fields, setFields] = useState<ThemeFieldBase[]>([]);
    const [values, setValues] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);

    // 拉取主题配置
    useEffect(() => {
        async function load() {
            if (!theme || theme === 'default') { // 默认主题不显示动态配置
                setFields([]);
                setValues({});
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const resp = await fetch(`/themes/${theme}/komari-theme.json`, { cache: 'no-cache' });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data: ThemeConfigResponse = await resp.json();
                if (!data.configuration?.data) {
                    setFields([]);
                    setValues({});
                    return;
                }
                const ds = data.configuration.data;
                setFields(ds);
                // 初始值：优先 publicInfo.theme_settings，其次 default
                const init: Record<string, any> = {};
                ds.forEach(f => {
                    if (f.type !== 'title' && f.key) {
                        init[f.key] = (themeSettings && themeSettings[f.key] !== undefined) ? themeSettings[f.key] : f.default;
                    }
                });
                setValues(init);
            } catch (e: any) {
                setError(e.message || '加载主题配置失败');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [theme, themeSettings]);

    const handleValueChange = (key: string, val: any) => {
        setValues(v => ({ ...v, [key]: val }));
    };

    const payload = useMemo(() => {
        // 全量：对所有字段（非 title）输出当前值
        const obj: Record<string, any> = {};
        fields.forEach(f => {
            if (f.type === 'title' || !f.key) return;
            const current = values[f.key];
            // 直接使用当前值，undefined 时才用默认值
            if (current !== undefined) {
                obj[f.key] = current;
            } else if (f.default !== undefined) {
                obj[f.key] = f.default;
            } else {
                obj[f.key] = '';
            }
        });
        return obj;
    }, [fields, values]);

    const saveAll = async () => {
        if (!theme) return;
        console.log('保存前的 values:', values);
        console.log('保存前的 payload:', payload);
        setSaving(true);
        try {
            const resp = await fetch(`/api/admin/theme/settings?theme=${encodeURIComponent(theme)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                const d = await resp.json().catch(() => ({ message: 'unknown' }));
                throw new Error(d.message || `HTTP ${resp.status}`);
            }
            toast.success('保存成功');
            // 刷新 publicInfo 以反映最新设置
            refresh();
        } catch (e: any) {
            toast.error(`保存失败: ${e.message || e}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Flex direction="column" gap="4" className="p-2 md:p-4">
            <Flex justify="between" align="center">
                <Heading size="4">{theme ? `${theme} 主题管理` : '主题管理'}</Heading>
                {fields.length > 0 && (
                    <Button onClick={saveAll} loading={saving} disabled={saving}>{saving ? '保存中...' : '保存全部'}</Button>
                )}
            </Flex>
            <Text size="2" color="gray">当前主题: <Code>{theme || 'default'}</Code></Text>
            {error && (
                <Callout.Root color="red"><Callout.Text>{error}</Callout.Text></Callout.Root>
            )}
            {loading && (
                <Flex align="center" gap="2"><Spinner /> <Text>加载中...</Text></Flex>
            )}
            {!loading && theme === 'default' && (
                <Callout.Root><Callout.Text>默认主题没有可配置选项。</Callout.Text></Callout.Root>
            )}
            {!loading && !error && fields.length === 0 && theme !== 'default' && (
                <Callout.Root><Callout.Text>该主题没有声明配置项。</Callout.Text></Callout.Root>
            )}
            <Separator size="4" />
            <Flex direction="column" gap="3">
                {fields.map((f, idx) => {
                    if (f.type === 'title') {
                        return <Heading key={idx} size="3" className="mt-4">{f.name || '标题'}</Heading>;
                    }
                    if (!f.key) return null;
                    const val = values[f.key];
                    switch (f.type) {
                        case 'switch':
                            return (
                                <SettingCardSwitch
                                    key={f.key}
                                    title={f.name}
                                    description={f.help}
                                    defaultChecked={!!val}
                                    onChange={(checked) => handleValueChange(f.key!, checked)}
                                />
                            );
                        case 'select': {
                            const opts = (f.options || '')
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean)
                                .map(o => ({ value: o }));
                            return (
                                <SettingCardSelect
                                    key={f.key}
                                    title={f.name}
                                    description={f.help}
                                    value={val}
                                    options={opts}
                                    OnSave={(v) => handleValueChange(f.key!, v)}
                                    label={val || '选择'}
                                />
                            );
                        }
                        case 'number':
                            return (
                                <SettingCardShortTextInput
                                    key={f.key}
                                    title={f.name}
                                    description={f.help}
                                    type="number"
                                    showSaveButton={false}
                                    value={val !== undefined ? String(val) : ''}
                                    onChange={(e) => handleValueChange(f.key!, e.target.value === '' ? undefined : Number(e.target.value))}
                                />
                            );
                        case 'string':
                        default:
                            return (    
                                <SettingCardShortTextInput
                                    key={f.key}
                                    title={f.name}
                                    description={f.help}
                                    value={val !== undefined ? String(val) : ''}
                                    required={f.required}
                                    showSaveButton={false}
                                    onChange={(e) => handleValueChange(f.key!, e.target.value)}
                                />
                            );
                    }
                })}
            </Flex>
            {fields.length > 0 && (
                <Flex><Button onClick={saveAll} loading={saving} disabled={saving}>{saving ? '保存中...' : '保存全部'}</Button></Flex>
            )}
        </Flex>
    );
};

export default ThemeManaged;
