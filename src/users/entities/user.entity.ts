import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { CourseByExam } from "src/course-by-exams/entities/course-by-exam.entity";
import { Course } from "src/courses/entities/course.entity";
import { Role } from "src/roles/role.enum";
import { Column, Entity, ManyToMany, OneToMany } from "typeorm";


@Entity()
export class User extends BaseWithCreatedBy {

    @Column()
    fullName: string;
    @Column()
    username: string;
    @Column()
    password: string;
    @Column({ default: false })
    isAdmin: boolean;

    @Column({ default: 'Học sinh', enum: Role })
    role: string;
    @Column({ default: '/public/default/default-user.jpg' })
    avatar: string;

    @Column({ nullable: true, type: 'text' })
    refreshToken: string | null;

    @ManyToMany(() => CourseByExam, courseByExam => courseByExam.students)
    joinedCourseByExams: CourseByExam[];

    // @ManyToMany(() => Course, course => course.users)
    // joinedCourses: Course[];
}
