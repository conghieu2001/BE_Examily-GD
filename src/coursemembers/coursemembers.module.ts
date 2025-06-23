import { Module } from '@nestjs/common';
import { CousemembersService } from './coursemembers.service';
import { CousemembersController } from './coursemembers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/courses/entities/course.entity';
import { User } from 'src/users/entities/user.entity';
import { CourseMember } from './entities/cousemember.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseMember, Course, User])],
  controllers: [CousemembersController],
  providers: [CousemembersService],
})
export class CoursemembersModule {}
