import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Question } from "src/questions/entities/question.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";

@Entity()
export class MultipeChoice extends BaseWithCreatedBy {
    @Column()
    name: string

    @OneToMany(() => Question, question => question.multipleChoice)
    questions: Question[];
}
