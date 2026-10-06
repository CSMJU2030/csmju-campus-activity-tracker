import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakeCoreHub } from './helpers/fake-core-hub';
import { InMemoryPrisma } from './helpers/in-memory-prisma';
import { TestSigningKey, createSigningKey, signCoreHubToken } from './helpers/token-factory';

const STARTS_AT = '2026-12-01T09:00:00.000Z';
const ENDS_AT = '2026-12-01T10:00:00.000Z';

describe('Activity API (e2e)', () => {
  let app: INestApplication;
  let coreHub: FakeCoreHub;
  let db: InMemoryPrisma;
  let key: TestSigningKey;
  let studentToken: string;
  let staffToken: string;
  let adminToken: string;
  let alumniToken: string;

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    key = await createSigningKey('core-hub-2026');
    coreHub = new FakeCoreHub();
    await coreHub.start([key]);

    process.env.CORE_HUB_URL = coreHub.url;
    process.env.CORE_HUB_JWKS_URL = coreHub.jwksUrl;
    db = new InMemoryPrisma();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    studentToken = await signCoreHubToken(key, {
      sub: 'student-001',
      email: 'student@core.local',
      role: 'student',
    });
    staffToken = await signCoreHubToken(key, {
      sub: 'staff-001',
      email: 'staff@core.local',
      role: 'staff',
    });
    adminToken = await signCoreHubToken(key, {
      sub: 'admin-001',
      email: 'admin@core.local',
      role: 'admin',
    });
    alumniToken = await signCoreHubToken(key, {
      sub: 'alumni-001',
      email: 'alumni@core.local',
      role: 'alumni',
    });
  });

  beforeEach(() => db.reset());

  afterAll(async () => {
    await app?.close();
    await coreHub?.stop();
  });

  it('requires authentication to list activities', async () => {
    await request(app.getHttpServer()).get('/api/v1/activities').expect(401);
  });

  it.each([
    ['student', () => studentToken],
    ['alumni', () => alumniToken],
  ])('%s can read activities but cannot create them', async (_role, token) => {
    await request(app.getHttpServer())
      .get('/api/v1/activities')
      .set(bearer(token()))
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set(bearer(token()))
      .send({ title: 'Not permitted', startsAt: STARTS_AT, endsAt: ENDS_AT })
      .expect(403);
  });

  it.each([
    ['staff', () => staffToken],
    ['admin', () => adminToken],
  ])('%s can create and publish an activity', async (_role, token) => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set(bearer(token()))
      .send({
        title: 'Published activity',
        startsAt: STARTS_AT,
        endsAt: ENDS_AT,
        status: 'PUBLISHED',
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      title: 'Published activity',
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      status: 'PUBLISHED',
    });

    const listing = await request(app.getHttpServer())
      .get('/api/v1/activities?status=PUBLISHED')
      .set(bearer(studentToken))
      .expect(200);
    expect(listing.body.data).toHaveLength(1);
    expect(listing.body.meta.total).toBe(1);
  });

  it('defaults newly created activities to drafts and filters by status', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set(bearer(staffToken))
      .send({ title: 'Draft activity', startsAt: STARTS_AT, endsAt: ENDS_AT })
      .expect(201)
      .expect(({ body }) => expect(body.data.status).toBe('DRAFT'));

    const published = await request(app.getHttpServer())
      .get('/api/v1/activities?status=PUBLISHED')
      .set(bearer(studentToken))
      .expect(200);
    expect(published.body.data).toHaveLength(0);

    const drafts = await request(app.getHttpServer())
      .get('/api/v1/activities?status=DRAFT')
      .set(bearer(staffToken))
      .expect(200);
    expect(drafts.body.data).toHaveLength(1);
  });

  it('validates activity payloads and query parameters', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set(bearer(staffToken))
      .send({ title: 'Invalid status', startsAt: STARTS_AT, endsAt: ENDS_AT, status: 'LIVE' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set(bearer(staffToken))
      .send({
        title: 'Unexpected property',
        startsAt: STARTS_AT,
        endsAt: ENDS_AT,
        isAdmin: true,
      })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/activities?status=LIVE')
      .set(bearer(studentToken))
      .expect(400);
  });

  it('allows staff to update activities and denies students', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set(bearer(staffToken))
      .send({ title: 'Before update', startsAt: STARTS_AT, endsAt: ENDS_AT })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/activities/${created.body.data.id}`)
      .set(bearer(studentToken))
      .send({ title: 'Forbidden update' })
      .expect(403);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/activities/${created.body.data.id}`)
      .set(bearer(staffToken))
      .send({ title: 'After update', status: 'PUBLISHED' })
      .expect(200);

    expect(updated.body.data).toMatchObject({ title: 'After update', status: 'PUBLISHED' });
  });
});
