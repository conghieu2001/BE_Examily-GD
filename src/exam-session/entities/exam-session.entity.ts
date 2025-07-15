import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { CourseByExam } from "src/course-by-exams/entities/course-by-exam.entity";
import { SubmitAnswer } from "src/submit-answer/entities/submit-answer.entity";
import { Column, ManyToOne, OneToMany } from "typeorm";

export class ExamSession extends BaseWithCreatedBy {

    @ManyToOne(() => CourseByExam)
    courseByExam: CourseByExam;

    @Column({ type: 'timestamp' })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    submittedAt?: Date;

    @Column({ default: false })
    isSubmitted: boolean;

    @Column({ nullable: true })
    totalScore?: number;

    @Column({ nullable: true })
    correctCount?: number;

    @OneToMany(() => SubmitAnswer, a => a.session, { cascade: true })
    answers: SubmitAnswer[];
}
