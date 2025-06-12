import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Column, Entity, OneToMany } from "typeorm";
import { Groupmember } from 'src/groupmembers/entities/groupmember.entity';

@Entity({ name: 'groups' })
export class Group extends BaseWithCreatedBy {
    @Column()
    name: string
    @Column()
    description: string

    @OneToMany(() => Groupmember, member => member.group)
    members: Groupmember[];
}
