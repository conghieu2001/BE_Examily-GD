import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Subject } from "src/subjects/entities/subject.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, OneToOne } from "typeorm";

@Entity('classes')
export class Class extends BaseWithCreatedBy {
    @Column()
    name: string

    @OneToMany(() => Subject, subject => subject.class)
    subjects: Subject[];
}
