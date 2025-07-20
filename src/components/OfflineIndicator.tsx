import { usePWA } from '../hooks/usePWA';
import { WifiOff, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OfflineIndicator = () => {
  const { isOnline: isOnlineOffline } = usePWA();
  const { t: tOffline } = useTranslation();
  if (isOnlineOffline) {
    return null;
  }
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-sm">
        <WifiOff size={16} />
        <span>{tOffline('pwa.offline_hint')}</span>
      </div>
    </div>
  );
};

export const OnlineIndicator = () => {
  const { isOnline: isOnlineOnline } = usePWA();
  const { t: tOnline } = useTranslation();
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      {isOnlineOnline ? (
        <>
          <Wifi size={12} className="text-green-500" />
          <span>{tOnline('nodeCard.online')}</span>
        </>
      ) : (
        <>
          <WifiOff size={12} className="text-orange-500" />
          <span>{tOnline('nodeCard.offline')}</span>
        </>
      )}
    </div>
  );
};
