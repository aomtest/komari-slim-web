import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const { t } = useTranslation();
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            toast.info(
                <>
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="font-semibold text-sm">{t('pwa.install_prompt_title')}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('pwa.install_prompt_desc')}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => toast.dismiss()}> {t('pwa.later')} </Button>
                            <Button size="sm" onClick={handleInstallClick} className="flex items-center gap-1"> <Download size={14} /> {t('pwa.install')} </Button>
                        </div>
                    </div>
                </>
            );
        };
        const handleAppInstalled = () => {
            console.log('PWA was installed');
            setDeferredPrompt(null);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        toast.dismiss();
    };

    // 不再渲染弹窗组件，全部通过 toast 展示
    return null;
};
