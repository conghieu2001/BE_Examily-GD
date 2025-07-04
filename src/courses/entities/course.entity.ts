import { Column, Entity, OneToMany } from 'typeorm';
import { BaseWithCreatedBy } from 'src/common/entities/base-user-createdBy';
import { Exam } from 'src/exams/entities/exam.entity';

@Entity()
export class Course extends BaseWithCreatedBy {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  password: string

//   @OneToMany(() => Exam, exam => exam.course)
//   exams: Exam[];
}
