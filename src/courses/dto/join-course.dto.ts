import { IsOptional, IsString } from "class-validator";

export class JoinCourseDto {
  @IsOptional()
  @IsString()
  password?: string;
}