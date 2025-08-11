import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { ExamSession } from "src/exam-session/entities/exam-session.entity";
import { QuestionClone } from "src/question-clone/entities/question-clone.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class SubmitAnswer extends BaseWithCreatedBy {
    @ManyToOne(() => ExamSession, session => session.answers, { onDelete: 'CASCADE' })
    session: ExamSession;

    @ManyToOne(() => QuestionClone)
    questionclone: QuestionClone;

    // Dùng cho phần I (nhiều đáp án)
    @Column('int', { array: true, nullable: true })
    selectedOption?: number[];

    // Dùng cho phần II (true/false theo từng đáp án)
    @Column('jsonb', { nullable: true })
    selectedPairs?: { id: number, content: string; isCorrect: boolean }[];

    @Column({ default: false })
    isCorrect: boolean;

    @Column({ type: 'int' })
    order: number;

    // Dùng cho phần II và Tự luận
    @Column({ type: 'text', nullable: true })
    essayAnswer?: string;

    @Column({ type: 'float', nullable: true })
    pointsAchieved?: number;
    
}
