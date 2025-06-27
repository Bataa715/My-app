import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { setupOnMessageListener } from './firebase';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

export class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔔 NotificationService: Starting initialization...');
    console.log('🔔 NotificationService: Platform:', Capacitor.isNativePlatform() ? 'Native' : 'Web');

    try {
      if (Capacitor.isNativePlatform()) {
        await this.initializeNativeNotifications();
      } else {
        await this.initializeWebNotifications();
      }
      this.isInitialized = true;
      console.log('🔔 NotificationService: Initialization completed successfully');
    } catch (error) {
      console.error('❌ NotificationService: Failed to initialize:', error);
    }
  }

  private async initializeNativeNotifications(): Promise<void> {
    console.log('🔔 NotificationService: Initializing native notifications...');

    try {
      // Check current permission status first
      const currentPermission = await PushNotifications.checkPermissions();
      console.log('🔔 NotificationService: Current permission status:', currentPermission);

      // Request permission
      console.log('🔔 NotificationService: Requesting push notification permissions...');
      const permissionState = await PushNotifications.requestPermissions();
      console.log('🔔 NotificationService: Permission request result:', permissionState);

      if (permissionState.receive === 'granted') {
        console.log('✅ NotificationService: Push notification permission granted');
        
        // Register for push notifications
        console.log('🔔 NotificationService: Registering for push notifications...');
        await PushNotifications.register();
        console.log('✅ NotificationService: Push notifications registered successfully');
        
        // Set up listeners
        this.setupNativeListeners();
        
        // Note: FCM token will be obtained from the registration listener
        console.log('🔔 NotificationService: Waiting for registration token from Capacitor...');
      } else {
        console.warn('⚠️ NotificationService: Push notification permission denied or not granted');
        console.log('🔔 NotificationService: Permission state details:', permissionState);
      }
    } catch (error) {
      console.error('❌ NotificationService: Error in native notification initialization:', error);
      throw error;
    }
  }

  private async initializeWebNotifications(): Promise<void> {
    console.log('🔔 NotificationService: Initializing web notifications...');
    
    try {
      // Check current permission status
      const currentPermission = Notification.permission;
      console.log('🔔 NotificationService: Current web permission status:', currentPermission);
      
      // Request permission using browser API
      console.log('🔔 NotificationService: Requesting web notification permission...');
      const permission = await Notification.requestPermission();
      console.log('🔔 NotificationService: Web permission request result:', permission);

      if (permission === 'granted') {
        console.log('✅ NotificationService: Web notification permission granted');
        
        // For web, we need to use Firebase messaging
        console.log('🔔 NotificationService: Setting up web Firebase messaging...');
        this.setupWebListeners();
      } else {
        console.warn('⚠️ NotificationService: Web notification permission denied');
      }
    } catch (error) {
      console.error('❌ NotificationService: Error in web notification initialization:', error);
      throw error;
    }
  }

  private setupNativeListeners(): void {
    console.log('🔔 NotificationService: Setting up native listeners...');
    
    // Registration success - This is where we get the FCM token
    PushNotifications.addListener('registration', (token) => {
      console.log('✅ NotificationService: Push registration success!');
      console.log('🔔 NotificationService: Registration token:', token.value.substring(0, 20) + '...');
      this.fcmToken = token.value;
      console.log('✅ NotificationService: FCM token stored successfully');
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ NotificationService: Push registration error:', error);
      console.error('❌ NotificationService: Error details:', JSON.stringify(error, null, 2));
    });

    // Push notification received
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📩 NotificationService: Push notification received:', notification);
      
      // Show local notification for better UX
      this.showLocalNotification(notification);
    });

    // Push notification action performed
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('🔔 NotificationService: Push notification action performed:', notification);
    });

    console.log('✅ NotificationService: Native listeners set up successfully');
  }

  private setupWebListeners(): void {
    console.log('🔔 NotificationService: Setting up web listeners...');
    
    // Set up Firebase messaging listener for web
    setupOnMessageListener((payload) => {
      console.log('📩 NotificationService: Web push notification received:', payload);
      this.showLocalNotification(payload);
    });

    console.log('✅ NotificationService: Web listeners set up successfully');
  }

  private async showLocalNotification(notification: any): Promise<void> {
    try {
      const title = notification.title || notification.data?.title || 'New Notification';
      const body = notification.body || notification.data?.body || 'You have a new message';
      
      console.log('🔔 NotificationService: Showing local notification:', { title, body });
      
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Date.now(),
              sound: 'default',
              attachments: undefined,
              actionTypeId: '',
              extra: notification.data || {}
            }
          ]
        });
        console.log('✅ NotificationService: Local notification scheduled successfully');
      } else {
        // For web, use browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body: body,
            icon: '/icons/icon-192x192.png'
          });
          console.log('✅ NotificationService: Web notification shown successfully');
        }
      }
    } catch (error) {
      console.error('❌ NotificationService: Error showing local notification:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    console.log('🔔 NotificationService: Requesting permission...');
    
    try {
      if (Capacitor.isNativePlatform()) {
        const permissionState = await PushNotifications.requestPermissions();
        console.log('🔔 NotificationService: Native permission request result:', permissionState);
        return permissionState.receive === 'granted';
      } else {
        const permission = await Notification.requestPermission();
        console.log('🔔 NotificationService: Web permission request result:', permission);
        return permission === 'granted';
      }
    } catch (error) {
      console.error('❌ NotificationService: Error requesting permission:', error);
      return false;
    }
  }

  getFcmToken(): string | null {
    console.log('🔔 NotificationService: Getting FCM token:', this.fcmToken ? 'Token available' : 'No token');
    if (this.fcmToken) {
      console.log('🔔 NotificationService: Token preview:', this.fcmToken.substring(0, 20) + '...');
    }
    return this.fcmToken;
  }

  async checkPermission(): Promise<string> {
    console.log('🔔 NotificationService: Checking permission status...');
    
    try {
      if (Capacitor.isNativePlatform()) {
        const permissionState = await PushNotifications.checkPermissions();
        console.log('🔔 NotificationService: Native permission status:', permissionState);
        return permissionState.receive;
      } else {
        const status = Notification.permission;
        console.log('🔔 NotificationService: Web permission status:', status);
        return status;
      }
    } catch (error) {
      console.error('❌ NotificationService: Error checking permission:', error);
      return 'denied';
    }
  }

  // Method to wait for FCM token (useful for initialization)
  async waitForFcmToken(timeoutMs: number = 10000): Promise<string | null> {
    console.log('🔔 NotificationService: Waiting for FCM token...');
    
    if (this.fcmToken) {
      console.log('✅ NotificationService: FCM token already available');
      return this.fcmToken;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkToken = () => {
        if (this.fcmToken) {
          console.log('✅ NotificationService: FCM token received while waiting');
          resolve(this.fcmToken);
          return;
        }
        
        if (Date.now() - startTime > timeoutMs) {
          console.warn('⚠️ NotificationService: Timeout waiting for FCM token');
          resolve(null);
          return;
        }
        
        setTimeout(checkToken, 100);
      };
      
      checkToken();
    });
  }
}

export const notificationService = NotificationService.getInstance(); 