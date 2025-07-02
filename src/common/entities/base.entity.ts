import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Generated, Column, Entity } from 'typeorm';

@Entity()
export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Generated('uuid') // Tạo UUID tự động
    @Column()
    uuid: string;

    @Column({default:true})
    isActive: boolean = true; // Trạng thái hoạt động, mặc định là true

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date; // Xóa mềm
}