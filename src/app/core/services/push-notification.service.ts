import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:5002/api';
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Initialiser le service de notifications push
   */
  async initialize(): Promise<boolean> {
    try {
      // Vérifier si le Service Worker est supporté
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('⚠️ Service Worker ou Push API non supportés');
        return false;
      }

      // Enregistrer le Service Worker
      this.swRegistration = await navigator.serviceWorker.register('/assets/sw.js');
      console.log('✅ Service Worker enregistré:', this.swRegistration);

      // Attendre que le Service Worker soit actif
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker prêt');

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du Service Worker:', error);
      return false;
    }
  }

  /**
   * Demander la permission pour les notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications non supportées');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('🔔 Permission de notification:', permission);
    return permission;
  }

  /**
   * S'abonner aux notifications push
   */
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    try {
      // Vérifier si le Service Worker est initialisé
      if (!this.swRegistration) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Service Worker non initialisé');
        }
      }

      // Demander la permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission de notification refusée');
      }

      // Obtenir la clé VAPID publique
      const vapidPublicKey = await this.getVapidPublicKey().toPromise();
      if (!vapidPublicKey) {
        throw new Error('Impossible de récupérer la clé VAPID');
      }

      // Convertir la clé VAPID
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // S'abonner aux notifications push
      const subscription = await this.swRegistration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      console.log('✅ Abonnement push créé:', subscription);

      // Envoyer l'abonnement au serveur
      await this.sendSubscriptionToServer(subscription).toPromise();

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'abonnement aux notifications:', error);
      return null;
    }
  }

  /**
   * Se désabonner des notifications push
   */
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Désabonnement effectué');
        
        // Notifier le serveur
        await this.removeSubscriptionFromServer(subscription.endpoint).toPromise();
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur lors du désabonnement:', error);
      return false;
    }
  }

  /**
   * Vérifier si l'utilisateur est abonné
   */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'abonnement:', error);
      return false;
    }
  }

  /**
   * Obtenir la clé VAPID publique
   */
  getVapidPublicKey(): Observable<string> {
    return this.http.get<{ publicKey: string }>(`${this.API_URL}/push-notifications/vapid-public-key`)
      .pipe(
        map(response => response.publicKey),
        catchError(error => {
          console.error('❌ Erreur lors de la récupération de la clé VAPID:', error);
          return throwError(error);
        })
      );
  }

  /**
   * Envoyer l'abonnement au serveur
   */
  private sendSubscriptionToServer(subscription: PushSubscription): Observable<any> {
    const subscriptionData = {
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      }
    };

    return this.http.post(`${this.API_URL}/push-notifications/subscribe`, subscriptionData)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur lors de l\'envoi de l\'abonnement:', error);
          return throwError(error);
        })
      );
  }

  /**
   * Supprimer l'abonnement du serveur
   */
  private removeSubscriptionFromServer(endpoint: string): Observable<any> {
    return this.http.post(`${this.API_URL}/push-notifications/unsubscribe`, { endpoint })
      .pipe(
        catchError(error => {
          console.error('❌ Erreur lors de la suppression de l\'abonnement:', error);
          return throwError(error);
        })
      );
  }

  /**
   * Convertir une clé VAPID de base64 vers Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convertir un ArrayBuffer vers base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Tester l'envoi d'une notification
   */
  testNotification(title: string = 'Test', message: string = 'Ceci est un test'): Observable<any> {
    return this.http.post(`${this.API_URL}/push-notifications/test`, { title, message })
      .pipe(
        catchError(error => {
          console.error('❌ Erreur lors du test de notification:', error);
          return throwError(error);
        })
      );
  }

  /**
   * Obtenir les abonnements de l'utilisateur
   */
  getUserSubscriptions(): Observable<any> {
    return this.http.get(`${this.API_URL}/push-notifications/subscriptions`)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur lors de la récupération des abonnements:', error);
          return throwError(error);
        })
      );
  }
} 