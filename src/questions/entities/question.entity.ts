import { Answer } from "src/answers/entities/answer.entity";
import { Class } from "src/classes/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Exam } from "src/exams/entities/exam.entity";
import { Level } from "src/levels/entities/level.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Topic } from "src/topics/entities/topic.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

export enum QuestionType {
    MULTIPLE_CHOICE = 'multiple_choice',
    ESSAY = 'essay',
}

@Entity()
export class Question extends BaseWithCreatedBy {
    @Column()
    content: string
    @Column({
        type: 'enum',
        enum: QuestionType,
        default: QuestionType.MULTIPLE_CHOICE,
    })
    type: QuestionType;
    @ManyToOne(() => Exam, exam => exam.questions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exam_id' })
    exam: Exam;

    @ManyToOne(() => Subject, { nullable: true })
    @JoinColumn({ name: "subjectId" })
    subject: Subject;
    @ManyToOne(() => Topic, { nullable: true })
    @JoinColumn({ name: "topicId" })
    topic: Topic;
    @ManyToOne(() => Level, { nullable: true })
    @JoinColumn({ name: "levelId" })
    level: Level;
    @Column("decimal", { precision: 5, scale: 2 })
    score: number;
    @ManyToOne(() => Class, { nullable: true })
    @JoinColumn({ name: 'classId' })
    class: Class;

    @OneToMany(() => Answer, answer => answer.question, { cascade: true, onDelete: 'CASCADE' })
    answers: Answer[];
}
