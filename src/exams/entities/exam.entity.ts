import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
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

  @Column()
  totalMultipleChoiceScore: number;
  @Column({ nullable: true })
  totalMultipleChoiceScorePartI: number;
  @Column({ nullable: true })
  totalMultipleChoiceScorePartII: number;
  @Column({ nullable: true })
  totalMultipleChoiceScorePartIII: number;
  @Column()
  totalEssayScore: number;

  // @ManyToOne(() => Course, course => course.exams, { nullable: false, onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'course_id' })
  // course: Course;

  @ManyToMany(() => Question, question => question.exams)
  @JoinTable()
  questions: Question[];
}
