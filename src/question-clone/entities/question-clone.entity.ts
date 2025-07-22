import { AnswerClone } from "src/answer-clone/entities/answer-clone.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Exam } from "src/exams/entities/exam.entity";
import { Level } from "src/levels/entities/level.entity";
import { MultipeChoice } from "src/multipe-choice/entities/multipe-choice.entity";
import { QuestionScore } from "src/question-score/entities/question-score.entity";
import { Topic } from "src/topics/entities/topic.entity";
import { TypeQuestion } from "src/type-questions/entities/type-question.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class QuestionClone extends BaseWithCreatedBy {
    @Column()
    content: string

    @ManyToMany(() => Exam, exam => exam.questionclones)
    exams: Exam[];

    @ManyToOne(() => TypeQuestion, { nullable: true })
    @JoinColumn({ name: "typeQuestionId" })
    typeQuestion: TypeQuestion;

    @OneToMany(() => AnswerClone, answerclone => answerclone.questionclone, { cascade: true, onDelete: 'CASCADE' })
    answerclones: AnswerClone[];

    @ManyToOne(() => MultipeChoice, mc => mc.questionclones, { nullable: true })
    @JoinColumn({ name: 'multipleChoiceId' })
    multipleChoice: MultipeChoice;

    // @OneToMany(() => QuestionScore, qs => qs.question)
    // questionScores: QuestionScore[];
    @Column('float')
    score: number;

    @ManyToOne(() => Topic, { nullable: true })
    @JoinColumn({ name: "topicId" })
    topic: Topic;
    @ManyToOne(() => Level, { nullable: true })
    @JoinColumn({ name: "levelId" })
    level: Level;
}
