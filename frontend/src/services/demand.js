import { apiClient } from './api';
export async function analyzeDemand(payload) {
    const { data } = await apiClient.post('/api/analyze-demand', payload);
    return data;
}
