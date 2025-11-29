import { Request, Response, NextFunction } from "express";

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const roles: string[] = user.roles || [];

    const hasRole = roles.some((r) => allowedRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient role permissions",
      });
    }

    next();
  };
};
