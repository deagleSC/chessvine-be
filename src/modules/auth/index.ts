export { default as authRoutes } from "./routes/auth.routes";
export { User } from "./models/user.model";
export { authService } from "./services/auth.service";
export { jwtService } from "./services/jwt.service";
export { requireAuth, optionalAuth } from "./middleware/auth.middleware";
export type { AuthenticatedRequest } from "./middleware/auth.middleware";
export * from "./types";
