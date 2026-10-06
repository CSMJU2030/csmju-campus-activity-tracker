import { IsDateString, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ActivityStatus } from '../../../generated/prisma/client';

export class UpdateActivityDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsUrl() registrationUrl?: string;
  @IsOptional() @IsDateString() registrationDeadline?: string;
  @IsOptional() @IsEnum(ActivityStatus) status?: ActivityStatus;
}