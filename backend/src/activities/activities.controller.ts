import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';

@Controller('v1/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @RequirePermissions(Permission.ACTIVITY_CREATE)
  create(@CurrentUser() user: CoreHubIdentity, @Body() dto: CreateActivityDto) {
    return this.activitiesService.create(user.id, dto);
  }

  @Get()
  @RequirePermissions(Permission.ACTIVITY_READ)
  findAll(@CurrentUser() user: CoreHubIdentity, @Query() query: QueryActivitiesDto) {
    return this.activitiesService.findAll(query, user.subsystemRole);
  }

  @Get(':id')
  @RequirePermissions(Permission.ACTIVITY_READ)
  findOne(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string) {
    return this.activitiesService.findOne(id, user.subsystemRole);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ACTIVITY_UPDATE)
  update(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, dto, user.subsystemRole);
  }

  @Delete(':id')
  @RequirePermissions(Permission.ACTIVITY_UPDATE)
  remove(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string) {
    return this.activitiesService.remove(id, user.subsystemRole);
  }
}