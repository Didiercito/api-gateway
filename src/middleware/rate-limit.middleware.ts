import rateLimit from 'express-rate-limit';

export const rateLimitMiddleware = rateLimit({
  windowMs: 60000, 
  max: 100, 
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});