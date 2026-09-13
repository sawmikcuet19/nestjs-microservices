import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { KafkaModule } from '@app/kafka';
import { DatabaseModule } from '@app/database';
import { AuthController } from './auth-service.controller';
import { AuthService } from './auth-service.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    KafkaModule.register('auth-service-group'),
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AppModule {}
