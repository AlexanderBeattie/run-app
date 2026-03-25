import rateLimit from 'express-rate-limit';

const rateLimitMessage = (windowMinutes: number, max: number) => ({
  error: `Too many requests. Maximum ${max} requests per ${windowMinutes} minute${windowMinutes !== 1 ? 's' : ''}. Please try again later.`,
});

/**
 * Strict limiter for login attempts — prevents brute-force attacks.
 * 10 attempts per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage(15, 10),
  skipSuccessfulRequests: true,
});

/**
 * Strict limiter for account creation — prevents mass registration by bots.
 * 5 registrations per hour per IP.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage(60, 5),
});

/**
 * Geocode limiter — protects the Google Geocoding API key from scraping.
 * 30 requests per minute per IP.
 */
export const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage(1, 30),
});

/**
 * General API limiter — fair-use cap across all other endpoints.
 * 200 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage(15, 200),
});

/**
 * AI generation limiter — for any LLM/generative endpoints added in future.
 * 20 requests per hour per IP (expensive to serve, high abuse risk).
 */
export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage(60, 20),
});
