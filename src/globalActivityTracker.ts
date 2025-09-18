export interface Activity {
  id: number;
  action: string;
  user: string;
  target?: string;
  details?: string;
  timestamp: string;
  type: 'task' | 'connection' | 'profile' | 'admin' | 'system' | 'team' | 'member' | 'invitation';
}

class GlobalActivityTracker {
  private activities: Activity[] = [];
  private listeners: ((activity: Activity) => void)[] = [];

  trackActivity(activity: Omit<Activity, 'id' | 'timestamp'>): void {
    const newActivity: Activity = {
      ...activity,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    this.activities.unshift(newActivity);

    // Keep only last 100 activities
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }

    this.notifyListeners(newActivity);
  }

  getRecentActivities(limit: number = 50): Activity[] {
    return this.activities.slice(0, limit);
  }

  onNewActivity(callback: (activity: Activity) => void): void {
    this.listeners.push(callback);
  }

  removeAllListeners(): void {
    this.listeners = [];
  }

  private notifyListeners(activity: Activity): void {
    this.listeners.forEach(callback => {
      try {
        callback(activity);
      } catch (e) {
        console.error('Error in activity listener:', e);
      }
    });
  }

  clearActivities(): void {
    this.activities = [];
  }
}

export const globalActivityTracker = new GlobalActivityTracker();






