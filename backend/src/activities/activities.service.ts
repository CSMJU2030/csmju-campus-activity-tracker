import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.activity.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        hoursAwarded: dto.hoursAwarded,
        hourType: dto.hourType,
        capacity: dto.capacity,
        registrationDeadline: dto.registrationDeadline
          ? new Date(dto.registrationDeadline)
          : undefined,
        createdByCoreUserId,
      },
    });
  }

  async findAll(query: QueryActivitiesDto) {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.hourType ? { hourType: query.hourType } : {}),
    };

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

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto) {
    await this.findOne(id);

    return this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        registrationDeadline: dto.registrationDeadline
          ? new Date(dto.registrationDeadline)
          : undefined,
      },
    });
  }
}