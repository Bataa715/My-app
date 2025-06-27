'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { notificationService } from '@/lib/notificationService';
import { Capacitor } from '@capacitor/core';

export default function NotificationPermissionRequest() {
  const { t } = useTranslation();
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const status = await notificationService.checkPermission();
      setPermissionStatus(status);
      
      // Show request if permission is not granted
      if (status !== 'granted') {
        setShowRequest(true);
      }
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setPermissionStatus('granted');
        setShowRequest(false);
        // Re-initialize notification service
        await notificationService.initialize();
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setPermissionStatus('denied');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    if (Capacitor.isNativePlatform()) {
      // For native platforms, we can't directly open settings
      // Show instructions instead
      alert(t('notificationSettingsInstructions'));
    } else {
      // For web, we can try to open notification settings
      if ('Notification' in window) {
        // Some browsers support this
        try {
          // @ts-ignore - This is experimental API
          if (Notification.requestPermission) {
            Notification.requestPermission();
          }
        } catch (error) {
          console.error('Error opening notification settings:', error);
        }
      }
    }
  };

  if (!showRequest || permissionStatus === 'granted') {
    return null;
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          {permissionStatus === 'denied' ? (
            <BellOff className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {permissionStatus === 'denied' 
            ? t('notificationPermissionDenied') 
            : t('enableNotifications')
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-orange-700">
          {permissionStatus === 'denied' 
            ? t('notificationPermissionDeniedDesc')
            : t('notificationPermissionRequestDesc')
          }
        </p>
        
        <div className="flex gap-2">
          {permissionStatus !== 'denied' && (
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="flex-1"
              size="sm"
            >
              {isRequesting ? t('requesting') : t('allowNotifications')}
            </Button>
          )}
          
          {permissionStatus === 'denied' && (
            <Button
              onClick={handleOpenSettings}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('openSettings')}
            </Button>
          )}
          
          <Button
            onClick={() => setShowRequest(false)}
            variant="ghost"
            size="sm"
          >
            {t('notNow')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 