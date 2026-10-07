import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { ActivityHourCategory, ActivityStatus } from '../../../generated/prisma/client';

export class UpdateActivityDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsUrl() registrationUrl?: string | null;
  @IsOptional() @IsDateString() registrationDeadline?: string | null;
  @IsOptional() @IsEnum(ActivityHourCategory) activityHourCategory?: ActivityHourCategory | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) activityHours?: number | null;
  @IsOptional() @IsEnum(ActivityStatus) status?: ActivityStatus;
}