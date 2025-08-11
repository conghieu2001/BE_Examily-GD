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
import { Subject } from 'src/subjects/entities/subject.entity';
import { Class } from 'src/classes/entities/class.entity';
import { QuestionScore } from 'src/question-score/entities/question-score.entity';
import { QuestionClone } from 'src/question-clone/entities/question-clone.entity';

@Entity()
export class Exam extends BaseWithCreatedBy {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({type: 'float', nullable: true })
  totalMultipleChoiceScore: number;
  @Column({type: 'float', nullable: true })
  totalMultipleChoiceScorePartI: number;
  @Column({type: 'float', nullable: true })
  totalMultipleChoiceScorePartII: number;
  @Column({type: 'float', nullable: true })
  totalMultipleChoiceScorePartIII: number;
  @Column({type: 'float', nullable: true,})
  totalEssayScore: number;

  @ManyToMany(() => Question, question => question.exams)
  @JoinTable()
  questions: Question[];

  @ManyToMany(() => QuestionClone, question => question.exams)
  @JoinTable()
  questionclones: QuestionClone[];

  @ManyToOne(() => Class, cls => cls.exams, { nullable: true })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @ManyToOne(() => Subject, subj => subj.exams, { nullable: true })
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;


  @OneToMany(() => QuestionScore, qs => qs.exam, { cascade: true })
  // @JoinColumn({ name: 'questionScoreId' })
  questionScores: QuestionScore[];

  @Column({default: false})
  isCourseByExam: boolean
}
