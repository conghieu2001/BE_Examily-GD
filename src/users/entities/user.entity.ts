import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Role } from "src/roles/role.enum";
import { Column, Entity, OneToMany } from "typeorm";


@Entity()
export class User extends BaseWithCreatedBy {

    @Column()
    fullName: string;
    @Column()
    username: string;
    @Column()
    password: string;
    @Column({default: false})
    isAdmin: boolean ;

    @Column({ default: 'Học sinh', enum: Role })
    role: string;
    @Column({ default: '/public/default/default-user.jpg' })
    avatar: string;

    @Column({ nullable: true, type: 'text' })
    refreshToken: string | null;

    

}
