import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PWAUpdatePrompt = () => {
    // updateSW 状态已不再需要，直接在 Toast 内处理
    const { t } = useTranslation();

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const showToast = (updateFn: (() => Promise<void>)) => {
                toast.info(
                    <>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">{t('pwa.update_prompt_title')}</h3>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{t('pwa.update_prompt_desc')}</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => toast.dismiss()} className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"><X size={14} /></Button>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={() => toast.dismiss()} className="text-xs">{t('pwa.later')}</Button>
                            <Button size="sm" onClick={async () => { await updateFn(); toast.dismiss(); }} className="flex items-center gap-1 text-xs"><RefreshCw size={12} />{t('pwa.update_now')}</Button>
                        </div>
                    </>
                );
            };
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
                    const updateFn = async () => {
                        const registration = await navigator.serviceWorker.getRegistration();
                        if (registration && registration.waiting) {
                            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                        }
                    };
                    showToast(updateFn);
                }
            });
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration) {
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    const updateFn = async () => {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    };
                                    showToast(updateFn);
                                }
                            });
                        }
                    });
                }
            });
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 不再渲染弹窗组件，全部通过 toast 展示
    return null;
};