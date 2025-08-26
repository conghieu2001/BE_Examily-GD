import { title } from "process";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Course } from "src/courses/entities/course.entity";
import { ExamSession } from "src/exam-session/entities/exam-session.entity";
import { Exam } from "src/exams/entities/exam.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";


export enum statusExam {
    NOTSTARTED = 'notstarted',
    ONGOING = 'ongoing',
    ENDED = 'ended',
}

@Entity()
export class CourseByExam extends BaseWithCreatedBy {
    @Column()
    title: string
    // @Column({ default: false })
    // isLocked: boolean;

    @Column({ nullable: true })
    password?: string;

    @Column({ type: 'timestamp', nullable: true })
    availableFrom?: Date;

    @Column({ type: 'timestamp', nullable: true })
    availableTo?: Date;

    @ManyToOne(() => Exam, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examId' })
    exam: Exam;

    @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'courseId' })
    course: Course;

    @ManyToMany(() => User, user => user.joinedCourseByExams, { cascade: true })
    @JoinTable({
        name: 'course_by_exam_students',
        joinColumn: { name: 'course_by_exam_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
    })
    students: User[];

    @Column({
        type: 'enum',
        enum: statusExam,
        default: statusExam.NOTSTARTED,
    })
    status: statusExam;

    @OneToMany(() => ExamSession, es => es.courseByExam)
    examSessions: ExamSession[];

    @Column({default: 1}) 
    examsCount: number

    @Column({default: 'official'})
    typeExam: string
}
