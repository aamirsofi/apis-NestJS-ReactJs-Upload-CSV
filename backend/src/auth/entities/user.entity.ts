/**
 * user.entity.ts - User Database Entity
 *
 * This file defines the database table structure for users.
 * TypeORM uses this class to create and manage the 'users' table.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true }) // Ensure email is unique
export class UserEntity {
  /**
   * Primary Key - Auto-generated UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Email Column
   * User's email address (unique, required)
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /**
   * Password Column
   * Hashed password (required)
   */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /**
   * First Name Column
   * User's first name (optional)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  /**
   * Last Name Column
   * User's last name (optional)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  /**
   * Created At Column
   * Automatically set when user is created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Updated At Column
   * Automatically updated when user record is modified
   */
  @UpdateDateColumn()
  updatedAt: Date;
}

