import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Column, Entity } from "typeorm";

@Entity()
export class MultipeChoice extends BaseWithCreatedBy{
    @Column()
    name: string
}
