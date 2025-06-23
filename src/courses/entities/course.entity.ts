import { Column, Entity, OneToMany } from 'typeorm';
import { BaseWithCreatedBy } from 'src/common/entities/base-user-createdBy';
import { Exam } from 'src/exams/entities/exam.entity';
import { CourseMember } from 'src/coursemembers/entities/cousemember.entity';

@Entity()
export class Course extends BaseWithCreatedBy {
  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => CourseMember, member => member.course)
  members: CourseMember[];

  @OneToMany(() => Exam, exam => exam.course)
  exams: Exam[];
}
