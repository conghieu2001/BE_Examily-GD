import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { BaseWithCreatedBy } from 'src/common/entities/base-user-createdBy';
import { CourseByExam } from 'src/course-by-exams/entities/course-by-exam.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Course extends BaseWithCreatedBy {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  password?: string;

  // @Column({ default: false })
  // isLocked: boolean;

  @OneToMany(() => CourseByExam, courseByExam => courseByExam.course)
  courseByExams: CourseByExam[];
}
