export type TokenType = "access" | "refresh";

export interface AuthenticatedUser {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  type: TokenType;
}

export interface RequestUser extends AuthenticatedUser {
  iat?: number;
  exp?: number;
}
