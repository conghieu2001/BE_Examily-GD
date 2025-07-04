import { Answer } from "src/answers/entities/answer.entity";
import { Class } from "src/classes/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Exam } from "src/exams/entities/exam.entity";
import { Level } from "src/levels/entities/level.entity";
import { MultipeChoice } from "src/multipe-choice/entities/multipe-choice.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Topic } from "src/topics/entities/topic.entity";
import { TypeQuestion } from "src/type-questions/entities/type-question.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Question extends BaseWithCreatedBy {
    @Column()
    content: string
    @ManyToMany(() => Exam, exam => exam.questions)
    exams: Exam[];

    @ManyToOne(() => Subject, { nullable: true })
    @JoinColumn({ name: "subjectId" })
    subject: Subject;
    @ManyToOne(() => Topic, { nullable: true })
    @JoinColumn({ name: "topicId" })
    topic: Topic;
    @ManyToOne(() => Level, { nullable: true })
    @JoinColumn({ name: "levelId" })
    level: Level;
    // @Column("decimal", { precision: 5, scale: 2, nullable: true })
    // score: number;
    @ManyToOne(() => Class, { nullable: true })
    @JoinColumn({ name: 'classId' })
    class: Class;
    @ManyToOne(() => TypeQuestion, { nullable: true })
    @JoinColumn({ name: "typeQuestionId" })
    typeQuestion: TypeQuestion;

    @OneToMany(() => Answer, answer => answer.question, { cascade: true, onDelete: 'CASCADE' })
    answers: Answer[];

    @ManyToOne(() => MultipeChoice, mc => mc.questions, { nullable: true })
    @JoinColumn({ name: 'multipleChoiceId' })
    multipleChoice: MultipeChoice;
}
