import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "./constants";
import { Request, Response, NextFunction } from "express";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

export const createToken = (
  id: string,
  email: string,
  role: string,
  expiresIn: string = "7d"
): string => {
  const payload: JwtPayload = { id, email, role };
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn });
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.signedCookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token.",
        });
      }

      res.locals.jwtData = decoded as JwtPayload;
      next();
    }
  );
};

export default {
  createToken,
  verifyToken,
};
