import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { RoleInGroupModule } from './role_in_group/role_in_group.module';
import { ExamsModule } from './exams/exams.module';
import { QuestionsModule } from './questions/questions.module';
import { CoursesModule } from './courses/courses.module';

import { SubjectsModule } from './subjects/subjects.module';   // ✅ Thêm
import { TopicsModule } from './topics/topics.module';         // ✅ Thêm
import { AnswersModule } from './answers/answers.module';
import { ClassesModule } from './classes/classes.module';
import { LevelsModule } from './levels/levels.module';
import { MultipeChoiceModule } from './multipe-choice/multipe-choice.module';
import { TypeQuestionsModule } from './type-questions/type-questions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.development',
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public', // http://localhost:3000/public/image.png
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') ?? process.env.DB_HOST,
        port: configService.get<number>('DB_PORT') ?? parseInt(process.env.DB_PORT || '5432', 10),
        username: configService.get<string>('DB_USERNAME') ?? process.env.DB_USERNAME,
        password: configService.get<string>('DB_PASSWORD') ?? process.env.DB_PASSWORD,
        database: configService.get<string>('DB_DATABASE') ?? process.env.DB_DATABASE,
        autoLoadEntities: true,
        synchronize: true, // ❗️Không bật ở môi trường production
      }),
      inject: [ConfigService],
    }),

    // Các modules ứng dụng
    AuthModule,
    UsersModule,
    RolesModule,
    RoleInGroupModule,
    ExamsModule,
    QuestionsModule,
    CoursesModule,
    ClassesModule,
    LevelsModule,
    MultipeChoiceModule,
    SubjectsModule,
    TopicsModule, 
    AnswersModule, TypeQuestionsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
