import { Class } from "src/classes/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Topic } from "src/topics/entities/topic.entity";
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
}
