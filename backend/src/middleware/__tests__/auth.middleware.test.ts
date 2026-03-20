import { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../auth.middleware';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireAuth middleware', () => {
  it('returns 401 if no authorization header', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;
    requireAuth(req as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Basic token123' } } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;
    requireAuth(req as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 if token is invalid', () => {
    const req = { headers: { authorization: 'Bearer invalidtoken' } } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;
    requireAuth(req as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('calls next and sets user if token is valid', () => {
    const token = jwt.sign({ id: 'user-1', email: 'test@test.com', role: 'runner' }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;
    requireAuth(req as any, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user.id).toBe('user-1');
    expect((req as any).user.email).toBe('test@test.com');
  });

  it('returns 401 for expired token', () => {
    const token = jwt.sign({ id: 'user-1', email: 'test@test.com', role: 'runner' }, 'test-secret', { expiresIn: '0s' });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;
    setTimeout(() => {
      requireAuth(req as any, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    }, 10);
  });
});