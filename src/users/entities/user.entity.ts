import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Role } from "src/roles/role.enum";
import { Column, Entity, OneToMany } from "typeorm";
import { CourseMember } from "src/coursemembers/entities/cousemember.entity";


@Entity()
export class User extends BaseWithCreatedBy {

    @Column()
    fullName: string;
    @Column()
    username: string;
    @Column()
    email: string;
    @Column()
    password: string;
    @Column()
    isAdmin: boolean;
    @Column({ default: 'Học sinh', enum: Role })
    role: string;
    @Column({ default: 'default-user.png' })
    images: string;

    @Column({ nullable: true, type: 'text' })
    refreshToken: string | null;

    @OneToMany(() => CourseMember, member => member.user)
    courseMembers: CourseMember[];
}
