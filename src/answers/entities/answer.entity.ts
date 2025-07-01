import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Question } from "src/questions/entities/question.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity()
export class Answer extends BaseWithCreatedBy{
    @Column()
    content: string;
    @ManyToOne(() => Question, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "questionId" })
    question?: Question
    @Column()
    isCorrect: boolean;
}
