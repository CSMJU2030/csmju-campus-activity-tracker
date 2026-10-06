import { IsDateString, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ActivityStatus } from '../../../generated/prisma/client';

export class CreateActivityDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsUrl()
  registrationUrl?: string;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;
}