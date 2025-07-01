import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Question } from "src/questions/entities/question.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Topic extends BaseWithCreatedBy {
    @Column()
    name: string

    @ManyToOne(() => Subject, subject => subject.topics, { onDelete: 'CASCADE' })
    @JoinColumn()
    subject: Subject;

    @OneToMany(() => Question, question => question.topic)
    questions: Question[];
}
