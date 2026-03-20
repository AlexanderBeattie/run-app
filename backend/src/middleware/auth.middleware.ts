import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorised' }); return; }
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET!) as { id: string; email: string; role: string; };
    req.user = payload; next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}