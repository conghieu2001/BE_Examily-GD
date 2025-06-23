import { Entity, ManyToOne, Column } from 'typeorm';
import { BaseWithCreatedBy } from 'src/common/entities/base-user-createdBy';
import { Course } from 'src/courses/entities/course.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class CourseMember extends BaseWithCreatedBy {
  @ManyToOne(() => Course, course => course.members, { onDelete: 'CASCADE' })
  course: Course;

  @ManyToOne(() => User, user => user.courseMembers, { onDelete: 'CASCADE' })
  user: User;

}
