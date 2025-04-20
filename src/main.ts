import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { doubleCsrf } from 'csrf-csrf';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { generateToken, doubleCsrfProtection, invalidCsrfTokenError } = doubleCsrf({
    cookieName: 'double-csrf-secret',
    getSecret: () => process.env.CSRF_SECRET || '',
    cookieOptions: { httpOnly: true, secure: false, sameSite: 'strict' },
    getTokenFromRequest: (req) => {
      return req.headers['x-csrf-token'] ?? null;
    },
  });

  app.use(cookieParser());

  app.getHttpAdapter().get('/csrf-token', (req, res) => {
    const csrfToken = generateToken(req, res);
    res.json({ csrfToken });
  });

  app.use((req, res, next) => {
    console.log(req.path);
    if (req.path !== '/csrf-token') return doubleCsrfProtection(req, res, next);
    return next();
  });

  app.use((err, req, res, next) => {
    if (err === invalidCsrfTokenError) {
      console.error('Received invalid or missing CSRF token:', {
        token: req.headers['x-csrf-token'],
        tokenInCookie: req.cookies['double-csrf-secret'],
        error: err.message,
      });
      return res.status(403).json({ message: 'Invalid or missing CSRF token.' });
    }
    next(err);
  });

  const config = new DocumentBuilder()
    .setTitle('Orion Auth API')
    .setDescription('Orion-Auth api description')
    .setVersion('1.0')
    .addTag('Auth')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();