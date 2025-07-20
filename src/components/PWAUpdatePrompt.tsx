import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PWAUpdatePrompt = () => {
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
    const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // Listen for the waiting service worker event
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
                    setShowUpdatePrompt(true);
                    setUpdateSW(() => async () => {
                        // Send a message to the waiting service worker to activate
                        const registration = await navigator.serviceWorker.getRegistration();
                        if (registration && registration.waiting) {
                            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                }
            });

            // Check for updates on page load
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration) {
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    setShowUpdatePrompt(true);
                                    setUpdateSW(() => async () => {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    });
                                }
                            });
                        }
                    });
                }
            });

            // Listen for controlled change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    }, []);

    const handleUpdate = async () => {
        if (updateSW) {
            await updateSW();
            setShowUpdatePrompt(false);
        }
    };

    if (!showUpdatePrompt) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg shadow-lg max-w-sm">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                            {t('pwa.update_prompt_title')}
                        </h3>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            {t('pwa.update_prompt_desc')}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowUpdatePrompt(false)}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                    >
                        <X size={14} />
                    </Button>
                </div>
                <div className="flex gap-2 mt-3">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowUpdatePrompt(false)}
                        className="text-xs"
                    >
                        {t('pwa.later')}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleUpdate}
                        className="flex items-center gap-1 text-xs"
                    >
                        <RefreshCw size={12} />
                        {t('pwa.update_now')}
                    </Button>
                </div>
            </div>
        </div>
    );
};