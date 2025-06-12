import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Group } from "src/groups/entities/group.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Groupmember extends BaseWithCreatedBy {
    @ManyToOne(() => Group, group => group.members)
    group: Group;

    @ManyToOne(() => User, user => user.groupMembers)
    user: User;

    @Column({ default: 'member' })
    role: string;

}
