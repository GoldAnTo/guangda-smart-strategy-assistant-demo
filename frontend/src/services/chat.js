import { apiClient } from './api';
export async function sendChat(payload) {
    const { data } = await apiClient.post('/api/chat', payload);
    return data;
}
