const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3001/api');

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
      }
      throw new Error(data.error || 'Terjadi kesalahan');
    }

    return data;
  }

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async logout() {
    this.setToken(null);
  }

  async getProfile() {
    return this.request<{ user: any; stats: any }>('/auth/profile');
  }

  async updateProfile(data: { name?: string; email?: string }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteAccount() {
    return this.request('/auth/account', { method: 'DELETE' });
  }

  async getDashboardStats() {
    return this.request<{ stats: any; uptimeData: any[]; recentNotifications: any[] }>('/dashboard/stats');
  }

  async getServers() {
    return this.request<{ servers: any[] }>('/servers');
  }

  async getServer(id: string) {
    return this.request<{ server: any; logs: any[]; uptimeData: any[] }>(`/servers/${id}`);
  }

  async createServer(data: { name: string; domain: string; interval?: number; emailNotif?: boolean; whatsappNotif?: boolean }) {
    return this.request('/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateServer(id: string, data: any) {
    return this.request(`/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteServer(id: string) {
    return this.request(`/servers/${id}`, { method: 'DELETE' });
  }

  async checkServerNow(id: string) {
    return this.request(`/servers/${id}/check`, { method: 'POST' });
  }

  async getCurrentPlan() {
    return this.request<{ plan: string; expiresAt: string; daysRemaining: number; limits: any }>('/billing/plan');
  }

  async createPayment() {
    return this.request<{ orderId: string; token: string; redirectUrl: string; clientKey: string }>('/billing/create-payment', {
      method: 'POST',
    });
  }

  async confirmPayment(orderId: string) {
    return this.request<{ success: boolean; message: string }>('/billing/confirm-payment', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }

  async checkPaymentStatus(orderId: string) {
    return this.request(`/billing/status/${orderId}`);
  }

  async getPaymentHistory() {
    return this.request<{ payments: any[] }>('/billing/history');
  }

  async getNotifications(limit = 20, unreadOnly = false) {
    return this.request<{ notifications: any[]; unreadCount: number }>(`/notifications?limit=${limit}&unreadOnly=${unreadOnly}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  async getNotificationSettings() {
    return this.request('/notifications/settings');
  }

  async updateNotificationSettings(data: any) {
    return this.request('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateWhatsapp(whatsapp: string) {
    return this.request('/notifications/whatsapp', {
      method: 'PUT',
      body: JSON.stringify({ whatsapp }),
    });
  }

  async getMidtransConfig() {
    return this.request<{ clientKey: string; isProduction: boolean }>('/config/midtrans');
  }

  async sendStatusReport() {
    return this.request<{ success: boolean; email: string }>('/send-report', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
export default api;
