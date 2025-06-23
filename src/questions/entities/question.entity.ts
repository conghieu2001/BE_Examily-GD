import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Exam } from "src/exams/entities/exam.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

export enum QuestionType {
    MULTIPLE_CHOICE = 'multiple_choice',
    ESSAY = 'essay',
}

@Entity()
export class Question extends BaseWithCreatedBy {
    @Column()
    content: string
    @Column({
        type: 'enum',
        enum: QuestionType,
        default: QuestionType.MULTIPLE_CHOICE,
    })
    type: QuestionType;
    @ManyToOne(() => Exam, exam => exam.questions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exam_id' })
    exam: Exam;

    // @OneToMany(() => AnswerOption, option => option.question, {
    //     cascade: true,
    //     nullable: true,
    // })
    // options: AnswerOption[];
}
