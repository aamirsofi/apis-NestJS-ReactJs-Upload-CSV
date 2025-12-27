import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CsvImportModule } from './csv-import/csv-import.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CsvImportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

