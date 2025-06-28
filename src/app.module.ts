import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { RoleInGroupModule } from './role_in_group/role_in_group.module';
import { ExamsModule } from './exams/exams.module';
import { QuestionsModule } from './questions/questions.module';
import { CoursesModule } from './courses/courses.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
// import { CoursemembersModule } from './coursemembers/coursemembers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}`  : '.env.development',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, ServeStaticModule.forRoot({
        rootPath: join(__dirname, '..', 'public'),
        serveRoot: '/public', // URL gốc, ví dụ: http://localhost:3000/index.html
      }),],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true, // Không nên bật ở production
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    RoleInGroupModule,
    ExamsModule,
    QuestionsModule,
    CoursesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD, // Đăng ký AuthGuard cho tất cả các route
      useClass: AuthGuard,
    },
  ],
})
export class AppModule { }
