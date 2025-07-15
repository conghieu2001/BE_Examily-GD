import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { ExamSession } from "src/exam-session/entities/exam-session.entity";
import { Question } from "src/questions/entities/question.entity";
import { Column, ManyToOne } from "typeorm";

export class SubmitAnswer extends BaseWithCreatedBy {
    @ManyToOne(() => ExamSession, session => session.answers, { onDelete: 'CASCADE' })
    session: ExamSession;

    @ManyToOne(() => Question)
    question: Question;

    @Column({ nullable: true })
    selectedOption?: string | null;

    @Column({ default: false })
    isCorrect: boolean;

    @Column({ type: 'int' })
    order: number;

    @Column({ type: 'text', nullable: true })
    essayAnswer?: string;

    @Column({ type: 'float', nullable: true })
    essayScore?: number;
}
