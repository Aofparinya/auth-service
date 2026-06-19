import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { RequestUser } from "./auth.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user as RequestUser;
  },
);
