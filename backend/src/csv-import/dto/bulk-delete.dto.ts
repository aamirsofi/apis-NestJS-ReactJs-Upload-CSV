import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class BulkDeleteDto {
  @ApiProperty({
    description: 'Array of upload record IDs to delete',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}

