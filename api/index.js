// Vercel serverless entry. vercel.json rewrites every /api/* request here and passes the
// original path in the `__p` query parameter, so nested paths like /api/chores/3/complete work.
import { handleApi } from '../lib/app.js';

export default function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const original = url.searchParams.get('__p');
  if (original) {
    url.searchParams.delete('__p');
    req.url = '/api/' + original.replace(/^\/?(api\/)?/, '') + url.search;
  }
  return handleApi(req, res);
}
