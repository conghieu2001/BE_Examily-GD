import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { ErrorsInterceptor } from './common/interceptors/errors.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';

// 🔥 Thêm các import để dùng NestExpressApplication và path
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  // 👇 Tạo app với NestExpressApplication để dùng useStaticAssets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Serve static files từ thư mục "public" tại route "/api/public"
  app.useStaticAssets(path.join(__dirname, '..', 'public'), {
    prefix: '/api/public/',
  });
  // 👉 Thêm dòng này để tăng giới hạn request size
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  // app.useGlobalInterceptors(new ErrorsInterceptor());
  app.useGlobalInterceptors(new TimeoutInterceptor());

  // Global route prefix
  app.setGlobalPrefix('api');

  // Global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      disableErrorMessages: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS setup
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const configService = app.get(ConfigService);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Auto-generated API with Swagger')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port: number = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`✅ Server started: http://localhost:${port}/api/`);
  // console.log(`📁 Static file served at: http://localhost:${port}/api/public/`);
  console.log(`📦 Database connected: ${process.env.DB_DATABASE}`);
}
bootstrap();
