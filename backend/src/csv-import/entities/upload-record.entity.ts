import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { UploadStatus } from '../interfaces/upload-status.enum';

@Entity('upload_records')
export class UploadRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.PROCESSING,
  })
  status: UploadStatus;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', nullable: true })
  totalRows?: number;

  @Column({ type: 'jsonb', nullable: true })
  errors?: string[];

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, string>[]; // CSV data stored as JSONB
}
