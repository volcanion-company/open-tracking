import httpClient from './httpClient';
import { Partner, ApiKey, PaginatedResponse } from '@/types/models';

export interface CreatePartnerDto {
  name: string;
  code: string;
}

export interface UpdatePartnerDto {
  name?: string;
  status?: 'Active' | 'Inactive';
}

export interface CreateApiKeyDto {
  name: string;
  expiresAt?: string;
}

export class PartnerApi {
  private readonly basePath = '/partners';

  // Get all partners
  async getAll(): Promise<Partner[]> {
    return httpClient.get<Partner[]>(this.basePath);
  }

  // Get partner by ID
  async getById(id: string): Promise<Partner> {
    return httpClient.get<Partner>(`${this.basePath}/${id}`);
  }

  // Get partner by code
  async getByCode(code: string): Promise<Partner> {
    return httpClient.get<Partner>(`${this.basePath}/by-code/${code}`);
  }

  // Create partner
  async create(data: CreatePartnerDto): Promise<Partner> {
    return httpClient.post<Partner>(this.basePath, data);
  }

  // Update partner
  async update(id: string, data: UpdatePartnerDto): Promise<Partner> {
    return httpClient.put<Partner>(`${this.basePath}/${id}`, data);
  }

  // Toggle partner status (Active/Inactive)
  async toggleStatus(id: string): Promise<Partner> {
    return httpClient.patch<Partner>(`${this.basePath}/${id}/toggle-status`);
  }

  // Delete partner (soft delete)
  async delete(id: string): Promise<void> {
    return httpClient.delete<void>(`${this.basePath}/${id}`);
  }

  // Get partner API keys
  async getApiKeys(partnerId: string): Promise<ApiKey[]> {
    return httpClient.get<ApiKey[]>(`${this.basePath}/${partnerId}/api-keys`);
  }

  // Create API key
  async createApiKey(partnerId: string, data: CreateApiKeyDto): Promise<ApiKey> {
    return httpClient.post<ApiKey>(`${this.basePath}/${partnerId}/api-keys`, data);
  }

  // Regenerate API key
  async regenerateApiKey(partnerId: string, apiKeyId: string, data?: CreateApiKeyDto): Promise<ApiKey> {
    return httpClient.post<ApiKey>(
      `${this.basePath}/${partnerId}/api-keys/${apiKeyId}/regenerate`,
      data
    );
  }

  // Revoke API key
  async revokeApiKey(partnerId: string, apiKeyId: string): Promise<void> {
    return httpClient.delete<void>(`${this.basePath}/${partnerId}/api-keys/${apiKeyId}`);
  }

  // Get partner sub-systems
  async getSubSystems(partnerId: string): Promise<any[]> {
    return httpClient.get<any[]>(`${this.basePath}/${partnerId}/sub-systems`);
  }

  // Get sub-system by code
  async getSubSystemByCode(partnerId: string, code: string): Promise<any> {
    return httpClient.get<any>(`${this.basePath}/${partnerId}/sub-systems/by-code/${code}`);
  }
}

export const partnerApi = new PartnerApi();
export default partnerApi;
