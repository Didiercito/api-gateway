import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Missing token" });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (!decoded.roles || !decoded.roles.includes("Super_admin")) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Requires Super_admin role"
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}