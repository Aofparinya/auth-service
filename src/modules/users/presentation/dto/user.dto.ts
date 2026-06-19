import { ApiProperty, PartialType } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty({ type: [String], example: ["USER"] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roleCodes!: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignRolesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roleCodes!: string[];
}
