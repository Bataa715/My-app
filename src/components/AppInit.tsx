'use client';
import { useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import type { NotificationItem, ItemType } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { notificationService } from '@/lib/notificationService';

export default function AppInit() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();

  // This ref tracks if the setup has been completed for the current user's session
  const setupCompletedForUser = useRef<string | null>(null);

  useEffect(() => {
    // This function will be called by the message listener
    const handleIncomingMessage = async (payload: any) => {
      const currentUserId = auth.currentUser?.uid;

      let toastTitle: string;
      let toastDescription: string;
      let fStoreTitleKey: string = 'unknownNotificationTitle';
      let fStoreDescriptionKey: string = 'unknownNotificationDescription';
      let fStoreDescriptionPlaceholders: Record<string, string | number | null | undefined> = {};
      let fStoreImageUrl: string | null = null;
      let fStoreDataAiHint: string | null = null;
      let fStoreLink: string | null = null;
      let fStoreItemType: ItemType = 'general';
      let fStoreIsGlobal: boolean = false;

      if (payload?.data) {
        fStoreTitleKey = payload.data.titleKey || fStoreTitleKey;
        fStoreDescriptionKey = payload.data.descriptionKey || fStoreDescriptionKey;
        if (payload.data.descriptionPlaceholders) {
          try {
            fStoreDescriptionPlaceholders = typeof payload.data.descriptionPlaceholders === 'string'
              ? JSON.parse(payload.data.descriptionPlaceholders)
              : payload.data.descriptionPlaceholders;
          } catch (e) { console.error("Error parsing descriptionPlaceholders:", e); fStoreDescriptionPlaceholders = {}; }
        }
        fStoreImageUrl = payload.data.imageUrl || null;
        fStoreDataAiHint = payload.data.dataAiHint || null;
        fStoreLink = payload.data.link || payload.data.url || null;
        fStoreItemType = (payload.data.itemType as ItemType) || 'general';
        fStoreIsGlobal = payload.data.isGlobal === 'true' || payload.data.isGlobal === true || false;

        toastTitle = payload.data.titleKey ? t(payload.data.titleKey, fStoreDescriptionPlaceholders) : (payload.notification?.title || t(fStoreTitleKey));
        toastDescription = payload.data.descriptionKey ? t(payload.data.descriptionKey, fStoreDescriptionPlaceholders) : (payload.notification?.body || t(fStoreDescriptionKey));
      } else if (payload?.notification) {
        toastTitle = payload.notification.title || t(fStoreTitleKey);
        toastDescription = payload.notification.body || t(fStoreDescriptionKey);
        fStoreTitleKey = payload.notification.title || fStoreTitleKey;
        fStoreDescriptionKey = payload.notification.body || fStoreDescriptionKey;
        fStoreImageUrl = payload.notification.image || null;
      } else {
        toastTitle = t(fStoreTitleKey);
        toastDescription = t(fStoreDescriptionKey);
      }

      toast({
        title: toastTitle,
        description: toastDescription,
      });

      if (!currentUserId) return;

      if (payload) {
        const notificationToSave: Omit<NotificationItem, 'id'> = {
          titleKey: fStoreTitleKey,
          descriptionKey: fStoreDescriptionKey,
          descriptionPlaceholders: fStoreDescriptionPlaceholders,
          date: serverTimestamp(),
          read: false,
          imageUrl: fStoreImageUrl,
          dataAiHint: fStoreDataAiHint,
          link: fStoreLink,
          itemType: fStoreItemType,
          isGlobal: fStoreIsGlobal,
        };
        try {
          if (!notificationToSave.isGlobal) {
            await addDoc(collection(db, "users", currentUserId, "notifications"), notificationToSave);
          }
        } catch (error) {
          console.error("Error saving foreground notification to Firestore:", error);
        }
      }
    };

    // Main logic for notification setup
    const initializeNotifications = async () => {
      // Exit if no user or if setup has already been completed for this user in this session
      if (!user || setupCompletedForUser.current === user.uid) {
        console.log(`AppInit: Skipping notification setup - ${!user ? 'no user' : 'already completed for user'}`);
        return;
      }
      
      // Mark setup as in-progress for this user to prevent re-runs
      setupCompletedForUser.current = user.uid;
      console.log(`🔔 AppInit: Starting notification setup for user ${user.uid}`);
      console.log(`🔔 AppInit: User FCM token from context:`, user.fcmToken ? user.fcmToken.substring(0, 20) + '...' : 'none');

      try {
        // Initialize notification service
        console.log('🔔 AppInit: Initializing notification service...');
        await notificationService.initialize();
        console.log('✅ AppInit: Notification service initialized');
        
        // Wait for FCM token (this will wait for the Capacitor registration to complete)
        console.log('🔔 AppInit: Waiting for FCM token from Capacitor registration...');
        const fcmToken = await notificationService.waitForFcmToken(15000); // Wait up to 15 seconds
        
        if (fcmToken) {
          console.log('✅ AppInit: FCM token received from Capacitor');
          console.log('🔔 AppInit: FCM token preview:', fcmToken.substring(0, 20) + '...');
          
          // Update Firestore if token is new or different
          if (fcmToken !== user.fcmToken) {
            console.log("✅ AppInit: New FCM token found, updating Firestore");
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
              fcmToken: fcmToken,
              lastTokenUpdate: serverTimestamp()
            });
            console.log("✅ AppInit: Firestore updated with new FCM token");
          } else {
            console.log("ℹ️ AppInit: FCM token unchanged, no update needed");
          }
        } else {
          console.log("⚠️ AppInit: No FCM token received within timeout");
        }

        // Check permission status and show appropriate message
        const permissionStatus = await notificationService.checkPermission();
        console.log('🔔 AppInit: Permission status:', permissionStatus);
        
        if (permissionStatus === 'denied') {
          console.log('⚠️ AppInit: Notification permission denied, showing toast');
          toast({
            title: t('notificationPermissionDenied'),
            description: t('notificationPermissionDeniedDesc'),
            variant: "destructive",
          });
        } else if (permissionStatus === 'granted') {
          console.log("✅ AppInit: Notification permission granted");
        } else {
          console.log("ℹ️ AppInit: Notification permission status:", permissionStatus);
        }
      } catch (error) {
        console.error("❌ AppInit: Error during notification initialization:", error);
      }
    };

    initializeNotifications();

    // Cleanup function for the useEffect hook
    return () => {
      // When the user logs out (user object becomes null), we reset the ref
      // so that the setup can run again for the next user who logs in.
      if (!user) {
        console.log('AppInit: User logged out, resetting setup tracking');
        setupCompletedForUser.current = null;
      }
    };
  }, [user, toast, t]);

  return null;
}
