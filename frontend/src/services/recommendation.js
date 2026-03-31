import { apiClient } from './api';
export async function matchProducts(profile) {
    const { data } = await apiClient.post('/api/match-products', { profile });
    return data;
}
export async function generateExplanation(payload) {
    const { data } = await apiClient.post('/api/generate-explanation', payload);
    return data;
}
