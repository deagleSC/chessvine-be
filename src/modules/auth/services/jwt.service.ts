import jwt from "jsonwebtoken";
import { TokenPayload, AuthTokens } from "../types";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function getSecrets() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return {
    accessSecret: jwtSecret,
    refreshSecret: `${jwtSecret}_refresh`,
  };
}

export function generateTokens(payload: TokenPayload): AuthTokens {
  const { accessSecret, refreshSecret } = getSecrets();

  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload {
  const { accessSecret } = getSecrets();
  return jwt.verify(token, accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const { refreshSecret } = getSecrets();
  return jwt.verify(token, refreshSecret) as TokenPayload;
}

export const jwtService = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
};
