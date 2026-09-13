import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientKafka } from '@nestjs/microservices';
import { DatabaseService } from '@app/database';
import { users } from '@app/database';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async register(data: { email: string; password: string; name: string }) {
    const existingUser = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [newUser] = await this.databaseService.db
      .insert(users)
      .values({
        email: data.email,
        password: hashedPassword,
        name: data.name,
      })
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.USER_REGISTERED, {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(data: { email: string; password: string }) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    this.kafkaClient.emit(KAFKA_TOPICS.USER_LOGIN, {
      userId: user.id,
      email: user.email,
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const [user] = await this.databaseService.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
