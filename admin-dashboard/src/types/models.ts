// Domain models - matching backend DTOs

export interface Partner {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'Active' | 'Inactive' | 'Deleted';
  createdAt: string;
  updatedAt?: string;
  apiKeys?: ApiKey[];
  subSystems?: SubSystem[];
}

export interface SubSystem {
  id: string;
  partnerId: string;
  name: string;
  code: string;
  description?: string;
  status: 'Active' | 'Inactive' | 'Deleted';
  createdAt: string;
  updatedAt?: string;
  partner?: Partner;
}

export interface ApiKey {
  id: string;
  partnerId: string;
  name: string;
  keyHash: string;
  status: 'Active' | 'Revoked';
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  apiKey?: string; // Only available on creation (plain text)
}

export interface TrackingEvent {
  id: string;
  partnerId: string;
  subSystemId: string;
  eventType: string;
  eventTime: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  partner?: Partner;
  subSystem?: SubSystem;
}

// Query filters
export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface PartnerFilter extends DateRangeFilter {
  partnerId?: string;
  status?: string;
}

export interface SubSystemFilter extends DateRangeFilter {
  partnerId?: string;
  subSystemId?: string;
  status?: string;
}

export interface EventFilter extends DateRangeFilter {
  partnerId?: string;
  subSystemId?: string;
  eventType?: string;
}

// Analytics/Report models
export interface EventCount {
  eventType: string;
  count: number;
}

export interface TimeSeriesData {
  date: string;
  count: number;
  eventType?: string;
}

export interface SubSystemStats {
  subSystemId: string;
  subSystemName: string;
  eventCount: number;
  lastEventTime?: string;
}

export interface PartnerStats {
  partnerId: string;
  partnerName: string;
  totalEvents: number;
  activeSubSystems: number;
  lastEventTime?: string;
  topEventTypes?: EventCount[];
}

export interface DashboardStats {
  totalEvents: number;
  totalPartners: number;
  totalSubSystems: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  topPartners: PartnerStats[];
  topSubSystems: SubSystemStats[];
  eventTimeSeries: TimeSeriesData[];
  eventTypeDistribution: EventCount[];
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// Auth models (for future use)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'PartnerAdmin' | 'Viewer';
  partnerId?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
