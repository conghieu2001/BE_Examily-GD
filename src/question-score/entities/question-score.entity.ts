import { BaseEntity } from "src/common/entities/base.entity";
import { Exam } from "src/exams/entities/exam.entity";
import { Question } from "src/questions/entities/question.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class QuestionScore extends BaseEntity {
    @ManyToOne(() => Exam, exam => exam.questionScores, { onDelete: 'CASCADE' })
    exam: Exam;

    @ManyToOne(() => Question, question => question.questionScores, { onDelete: 'CASCADE' })
    question: Question;

    @Column('float')
    score: number;
}
