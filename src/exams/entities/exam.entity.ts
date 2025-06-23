import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseWithCreatedBy } from 'src/common/entities/base-user-createdBy';
import { Course } from 'src/courses/entities/course.entity';
import { Question } from 'src/questions/entities/question.entity';

@Entity()
export class Exam extends BaseWithCreatedBy {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @ManyToOne(() => Course, course => course.exams, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToMany(() => Question, question => question.exam)
  questions: Question[];
}
 