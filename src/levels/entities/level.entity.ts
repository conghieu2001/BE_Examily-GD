import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Question } from "src/questions/entities/question.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Level extends BaseWithCreatedBy {
    @Column()
    name: string

    @OneToMany(() => Question, question => question.level)
    questions: Question[];
}
