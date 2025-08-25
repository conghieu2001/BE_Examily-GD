import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity()
export class TypeQuestion extends BaseEntity{
    @Column()
    name: string
  static ESSAY: TypeQuestion;
}
