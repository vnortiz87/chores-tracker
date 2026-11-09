// Vercel serverless entry: every /api/* request is handled by the shared app core.
import { handleApi } from '../lib/app.js';

export default function handler(req, res) {
  return handleApi(req, res);
}
