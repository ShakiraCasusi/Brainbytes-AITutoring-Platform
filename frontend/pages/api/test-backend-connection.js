import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';

export default async function handler(req, res) {
  try {
    // Call the backend health check endpoint
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
    if (response.status === 200 && response.data.status === 'ok') {
      return res.status(200).json({ backendConnected: true });
    }
    return res.status(500).json({ backendConnected: false, error: 'Backend unhealthy' });
  } catch (error) {
    console.error('test-backend-connection error:', error.message);
    // fallback attempt to localhost if API_BASE_URL failed (e.g. DNS mismatch in dev environment)
    try {
      const fallbackUrl = 'http://localhost:4000/api/health';
      const response = await axios.get(fallbackUrl, { timeout: 2000 });
      if (response.status === 200) {
        return res.status(200).json({ backendConnected: true });
      }
    } catch (fallbackError) {
      console.error('Fallback connection to backend failed:', fallbackError.message);
    }
    return res.status(500).json({ backendConnected: false, error: error.message });
  }
}
