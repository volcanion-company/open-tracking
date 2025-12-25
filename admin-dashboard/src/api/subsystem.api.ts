import httpClient from './httpClient';
import { SubSystem } from '@/types/models';

export interface CreateSubSystemDto {
  partnerId: string;
  name: string;
  code: string;
}

export interface UpdateSubSystemDto {
  name?: string;
  status?: 'Active' | 'Inactive';
}

export class SubSystemApi {
  // Get all sub-systems across all partners
  async getAll(): Promise<SubSystem[]> {
    // Aggregate from all partners if needed, or use a dedicated endpoint
    return httpClient.get<SubSystem[]>('/sub-systems');
  }

  // Get sub-systems by partner
  async getByPartnerId(partnerId: string): Promise<SubSystem[]> {
    return httpClient.get<SubSystem[]>(`/partners/${partnerId}/sub-systems`);
  }

  // Get sub-system by ID
  async getById(partnerId: string, id: string): Promise<SubSystem> {
    return httpClient.get<SubSystem>(`/partners/${partnerId}/sub-systems/${id}`);
  }

  // Create sub-system under a partner
  async create(partnerId: string, data: Omit<CreateSubSystemDto, 'partnerId'>): Promise<SubSystem> {
    return httpClient.post<SubSystem>(`/partners/${partnerId}/sub-systems`, data);
  }

  // Update sub-system
  async update(partnerId: string, id: string, data: UpdateSubSystemDto): Promise<SubSystem> {
    return httpClient.put<SubSystem>(`/partners/${partnerId}/sub-systems/${id}`, data);
  }

  // Delete sub-system
  async delete(partnerId: string, id: string): Promise<void> {
    return httpClient.delete<void>(`/partners/${partnerId}/sub-systems/${id}`);
  }

  // Toggle sub-system status (Active/Inactive)
  async toggleStatus(partnerId: string, id: string): Promise<SubSystem> {
    return httpClient.patch<SubSystem>(`/partners/${partnerId}/sub-systems/${id}/toggle-status`);
  }
}

export const subSystemApi = new SubSystemApi();
export default subSystemApi;
