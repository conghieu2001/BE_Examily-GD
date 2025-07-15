import { Class } from "src/classes/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Question } from "src/questions/entities/question.entity";
import { Topic } from "src/topics/entities/topic.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Subject extends BaseWithCreatedBy {
    @Column()
    name: string

    @ManyToOne(() => Class, Class => Class.subjects, { onDelete: 'CASCADE' })
    @JoinColumn()
    class: Class;

    @OneToMany(() => Topic, topic => topic.subject, { cascade: true })
    topics: Topic[];

    @OneToMany(() => Question, question => question.subject)
    questions: Question[];

    @ManyToMany(() => User, user => user.subjects)
    users: User[];
}
