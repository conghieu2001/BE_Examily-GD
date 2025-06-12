import { Column, ManyToOne, JoinColumn, Entity } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { BaseEntity } from './base.entity';


export abstract class BaseWithCreatedBy extends BaseEntity {
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL'})
    @JoinColumn({ name: 'created_by' })
    createdBy: User | null = null;

    @Column({ default: false }) // Dữ liệu chung mặc định là true
    isPublic: boolean;
}