import { IsOptional, IsString } from "class-validator";

export class JoinCourseByExamDto {
  @IsOptional()
  @IsString()
  password?: string;
}