import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth-service.service';
import { DatabaseService } from '@app/database';
import { JwtService } from '@nestjs/jwt';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_SERVICE } from '@app/kafka';

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: DatabaseService;
  let jwtService: JwtService;
  let kafkaClient: ClientKafka;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: {
            db: {
              select: jest.fn().mockReturnThis(),
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              limit: jest.fn().mockResolvedValue([]),
              insert: jest.fn().mockReturnThis(),
              values: jest.fn().mockReturnThis(),
              returning: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: KAFKA_SERVICE,
          useValue: {
            connect: jest.fn(),
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    jwtService = module.get<JwtService>(JwtService);
    kafkaClient = module.get<ClientKafka>(KAFKA_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
