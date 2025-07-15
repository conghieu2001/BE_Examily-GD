import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Exam } from "src/exams/entities/exam.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, OneToOne } from "typeorm";

@Entity('classes')
export class Class extends BaseWithCreatedBy {
    @Column()
    name: string

    @OneToMany(() => Subject, subject => subject.class)
    subjects: Subject[];

    @ManyToMany(() => User, user => user.classes)
    users: User[];
}
