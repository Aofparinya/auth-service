import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@order-platform.local" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "ChangeMe123!" })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({ example: "Somchai" })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: "Jaidee" })
  @IsString()
  lastName!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class LogoutDto extends RefreshTokenDto {}

export class ValidateTokenDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
