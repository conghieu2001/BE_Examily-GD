import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Question } from "src/questions/entities/question.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";


export enum MultipeChoiceType {
    SELECT = 'select',
    TEXT = 'text',
}

@Entity()
export class MultipeChoice extends BaseWithCreatedBy {
    @Column()
    name: string

    @Column({
        type: 'enum',
        enum: MultipeChoiceType,
        default: MultipeChoiceType.SELECT,
    })
    type: MultipeChoiceType;

    @OneToMany(() => Question, question => question.multipleChoice)
    questions: Question[];
}
