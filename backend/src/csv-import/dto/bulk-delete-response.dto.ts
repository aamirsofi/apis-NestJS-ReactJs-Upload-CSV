import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteResponseDto {
  @ApiProperty({ description: 'Number of uploads deleted', example: 3 })
  deleted: number;

  @ApiProperty({ description: 'Success message', example: 'Successfully deleted 3 upload(s)' })
  message: string;
}

