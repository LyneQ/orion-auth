import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Throttling behavior', () => {
    it('should allow requests under the limit', async () => {
      const server = app.getHttpServer();

      // First request
      await request(server)
        .get('/')
        .expect(200)
        .expect('Hello World!');

      // Second request
      await request(server)
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });

    it('should block requests exceeding the limit', async () => {
      const server = app.getHttpServer();

      // Simulate hitting the rate limit
      await request(server).get('/').expect(200);
      await request(server).get('/').expect(200);
      await request(server).get('/').expect(200);
      await request(server).get('/').expect(200);
      await request(server).get('/').expect(200);
      await request(server).get('/').expect(200);
      await request(server).get('/').expect(200);
      await request(server).get('/').expect(200);


      // The rate limit should now be exceeded
      const response = await request(server).get('/');
      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
      });
    });
  });
});