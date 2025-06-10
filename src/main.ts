import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { ErrorsInterceptor } from './common/interceptors/errors.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //middlewares
  app.useGlobalFilters(new HttpExceptionFilter());
  // log time request
  app.useGlobalInterceptors(new LoggingInterceptor());
  // customize response
  app.useGlobalInterceptors(new TransformInterceptor());
  // handle errors
  app.useGlobalInterceptors(new ErrorsInterceptor);
  // handle timeout
  app.useGlobalInterceptors(new TimeoutInterceptor);
  
  // Global ValidationPipe để tự động validate DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các thuộc tính thừa
      forbidNonWhitelisted: true, // Báo lỗi nếu gửi các thuộc tính không hợp lệ
      transform: true, // Tự động convert kiểu dữ liệu
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Auto-generated API with Swagger')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  const port:number  = parseInt(process.env.PORT?.toString() || '30023');
  await app.listen(port);
  // log starting message
  console.log(`Nest application is starting: http://localhost:${port}`);
  console.log(`Database connected : ${process.env.DB_DATABASE}`);
}
bootstrap();