import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ActivityStatus, HourType } from '../../../generated/prisma/client';

export class UpdateActivityDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsNumber() @Min(0) hoursAwarded?: number;
  @IsOptional() @IsEnum(HourType) hourType?: HourType;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) capacity?: number;
  @IsOptional() @IsDateString() registrationDeadline?: string;
  @IsOptional() @IsEnum(ActivityStatus) status?: ActivityStatus;
}