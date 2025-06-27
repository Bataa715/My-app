'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AppVersion as AppVersionType } from '@/types';

// Simple semver comparison: returns true if v2 is newer than v1
const isNewerVersion = (v1: string, v2: string): boolean => {
    if (!v1 || !v2) return false;
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    const len = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p2 > p1) return true;
        if (p1 > p2) return false;
    }
    return false;
};

interface UpdateNotificationDialogProps {
  isOpen: boolean;
  onUpdate: () => void;
  onClose: () => void;
  isForceUpdate: boolean;
  updateMessage: string;
}

function UpdateNotificationDialog({ isOpen, onUpdate, onClose, isForceUpdate, updateMessage }: UpdateNotificationDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={isOpen} onOpenChange={!isForceUpdate ? onClose : undefined}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('updateAvailableTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{updateMessage || t('newVersionAvailableDesc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!isForceUpdate && <AlertDialogCancel onClick={onClose}>{t('updateLaterButton')}</AlertDialogCancel>}
          <AlertDialogAction onClick={onUpdate}>{t('updateNowButton')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function VersionCheck() {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [versionInfo, setVersionInfo] = useState<AppVersionType | null>(null);
  const { language } = useTranslation();

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const versionDocRef = doc(db, 'app_version', 'live');
        const versionDocSnap = await getDoc(versionDocRef);

        if (versionDocSnap.exists()) {
          const liveVersionData = versionDocSnap.data() as AppVersionType;
          const currentAppVersion = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
          
          if (isNewerVersion(currentAppVersion, liveVersionData.version)) {
             setVersionInfo(liveVersionData);
             setIsUpdateDialogOpen(true);
          }
        }
      } catch (error) {
        console.error("Error checking for app version:", error);
      }
    };

    // Check for version after a short delay to not block initial render
    const timer = setTimeout(checkVersion, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleClose = () => {
    setIsUpdateDialogOpen(false);
  };

  if (!versionInfo) {
    return null;
  }
  
  const message = versionInfo.updateMessage?.[language] || versionInfo.updateMessage?.['mn'] || "A new version of the app is available.";

  return (
    <UpdateNotificationDialog
      isOpen={isUpdateDialogOpen}
      onUpdate={handleUpdate}
      onClose={handleClose}
      isForceUpdate={versionInfo.isForceUpdate}
      updateMessage={message}
    />
  );
}
