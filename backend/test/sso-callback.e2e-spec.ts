import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SSO_COOKIE_NAME } from '../src/auth/sso-session';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakeCoreHub } from './helpers/fake-core-hub';
import { InMemoryPrisma } from './helpers/in-memory-prisma';
import { TestSigningKey, createSigningKey, signCoreHubToken, tamperPayload } from './helpers/token-factory';

describe('Central SSO callback (e2e)', () => {
  let app: INestApplication;
  let coreHub: FakeCoreHub;
  let key: TestSigningKey;
  let studentToken: string;
  let staffToken: string;

  const cookieFrom = (response: request.Response) => {
    const raw = response.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return cookies.find((cookie) => cookie.startsWith(`${SSO_COOKIE_NAME}=`)) ?? '';
  };

  beforeAll(async () => {
    key = await createSigningKey('core-hub-2026');
    coreHub = new FakeCoreHub();
    await coreHub.start([key]);
    process.env.CORE_HUB_URL = coreHub.url;
    process.env.CORE_HUB_JWKS_URL = coreHub.jwksUrl;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(new InMemoryPrisma())
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: 'auth/callback', method: RequestMethod.GET }],
    });
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
  });

  afterAll(async () => {
    await app?.close();
    await coreHub?.stop();
  });

  it('exchanges a valid Core Hub token for an HttpOnly session cookie', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ access_token: studentToken })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: 'student-001',
      email: 'student@core.local',
      subsystemRole: 'STUDENT',
    });
    expect(cookieFrom(response)).toContain('HttpOnly');
    expect(cookieFrom(response)).toContain('SameSite=Lax');
  });

  it('uses the SSO cookie to read identity and published activity APIs', async () => {
    const callback = await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ access_token: studentToken })
      .expect(200);
    const cookie = cookieFrom(callback);

    const identity = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Cookie', cookie)
      .expect(200);
    expect(identity.body.data.subsystemRole).toBe('STUDENT');

    const activities = await request(app.getHttpServer())
      .get('/api/v1/activities?status=PUBLISHED')
      .set('Cookie', cookie)
      .expect(200);
    expect(activities.body.data).toHaveLength(0);
  });

  it('enforces activity permissions after SSO', async () => {
    const callback = await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ access_token: studentToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set('Cookie', cookieFrom(callback))
      .send({
        title: 'Unauthorized activity',
        startsAt: '2026-12-01T09:00:00.000Z',
        endsAt: '2026-12-01T10:00:00.000Z',
      })
      .expect(403);
  });

  it('rejects tampered tokens and sets no session cookie', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ access_token: tamperPayload(studentToken, { role: 'admin' }) })
      .expect(401);

    expect(cookieFrom(response)).toBe('');
  });

  it('rejects an unmapped Core Hub role', async () => {
    const unsupportedToken = await signCoreHubToken(key, { role: 'finance-officer' });
    const response = await request(app.getHttpServer())
      .get('/auth/callback')
      .query({ access_token: unsupportedToken })
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(cookieFrom(response)).toBe('');
  });

  it('serves the callback at its registered root path', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/callback')
      .query({ access_token: staffToken })
      .expect(404);
  });
});
