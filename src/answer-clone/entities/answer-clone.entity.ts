import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { QuestionClone } from "src/question-clone/entities/question-clone.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity()
export class AnswerClone extends BaseWithCreatedBy {
    @Column()
    content: string;
    @ManyToOne(() => QuestionClone, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "questioncloneId" })
    questionclone?: QuestionClone
    @Column()
    isCorrect: boolean;
}
