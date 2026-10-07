import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityHourCategory, ActivityStatus } from '../../generated/prisma/client';
import { can, Permission } from '../auth/permissions';
import { SubsystemRole } from '../auth/core-hub-identity';
import { PrismaService } from '../prisma/prisma.service';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createdByCoreUserId: string, dto: CreateActivityDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const registrationDeadline = dto.registrationDeadline
      ? new Date(dto.registrationDeadline)
      : undefined;
    this.validateSchedule(startsAt, endsAt, registrationDeadline);
    this.validateActivityHours(dto.activityHourCategory, dto.activityHours);

    return this.prisma.activity.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startsAt,
        endsAt,
        registrationUrl: dto.registrationUrl,
        registrationDeadline,
        activityHourCategory: dto.activityHourCategory,
        activityHours: dto.activityHours,
        status: dto.status,
        createdByCoreUserId,
      },
    });
  }

  async findAll(query: QueryActivitiesDto, role: SubsystemRole) {
    const canManage = can(role, Permission.ACTIVITY_UPDATE);
    if (
      !canManage &&
      query.status !== undefined &&
      query.status !== ActivityStatus.PUBLISHED
    ) {
      return new CollectionResult(
        [],
        buildPaginationMeta(0, query.page ?? 1, query.limit ?? 20),
      );
    }
    const where = query.status
      ? { status: query.status }
      : canManage
        ? {}
        : { status: ActivityStatus.PUBLISHED };

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return new CollectionResult(items, buildPaginationMeta(total, query.page ?? 1, query.limit ?? 20));
  }

  async findOne(id: string, role: SubsystemRole) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (
      !activity ||
      (!can(role, Permission.ACTIVITY_UPDATE) && activity.status !== ActivityStatus.PUBLISHED)
    ) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto, role: SubsystemRole) {
    const existing = await this.findOne(id, role);
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    const registrationDeadline =
      dto.registrationDeadline === undefined
        ? existing.registrationDeadline ?? undefined
        : dto.registrationDeadline === null
          ? undefined
          : new Date(dto.registrationDeadline);
    this.validateSchedule(startsAt, endsAt, registrationDeadline);
    this.validateActivityHours(
      dto.activityHourCategory === undefined
        ? existing.activityHourCategory
        : dto.activityHourCategory,
      dto.activityHours === undefined ? existing.activityHours : dto.activityHours,
    );

    return this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        startsAt: dto.startsAt ? startsAt : undefined,
        endsAt: dto.endsAt ? endsAt : undefined,
        registrationDeadline:
          dto.registrationDeadline === undefined ? undefined : registrationDeadline ?? null,
      },
    });
  }

  async remove(id: string, role: SubsystemRole) {
    await this.findOne(id, role);
    return this.prisma.activity.delete({ where: { id } });
  }

  private validateSchedule(startsAt: Date, endsAt: Date, registrationDeadline?: Date): void {
    if (endsAt <= startsAt) {
      throw new BadRequestException('Activity end time must be after start time');
    }
    if (registrationDeadline && registrationDeadline > startsAt) {
      throw new BadRequestException('Registration deadline must not be after activity start time');
    }
  }

  private validateActivityHours(
    category: ActivityHourCategory | null | undefined,
    hours: number | null | undefined,
  ): void {
    if ((category == null) !== (hours == null)) {
      throw new BadRequestException('Activity hour category and hours must be provided together');
    }
  }
}