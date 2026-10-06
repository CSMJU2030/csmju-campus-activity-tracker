import { IsEnum, IsOptional } from 'class-validator';
import { ActivityStatus } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryActivitiesDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;
}