import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { CourseByExam } from "src/course-by-exams/entities/course-by-exam.entity";
import { Exam } from "src/exams/entities/exam.entity";
import { SubmitAnswer } from "src/submit-answer/entities/submit-answer.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class ExamSession extends BaseWithCreatedBy {

  @ManyToOne(() => CourseByExam)
  @JoinColumn({ name: 'courseByExamId' })
  courseByExam: CourseByExam;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ default: false })
  isSubmitted: boolean;

  @Column({type: 'float', nullable: true })
  totalScore?: number;

  @Column({ nullable: true })
  correctCount?: number;

  @OneToMany(() => SubmitAnswer, a => a.session, { cascade: true })
  answers: SubmitAnswer[];

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @Column({ type: 'json', nullable: true })
  questionOrder: number[];

  @Column({ type: 'float',default: 0 })
  totalMultipleChoiceScore: number;
  @Column({ type: 'float', nullable: true})
  essayScore?: number;
}
