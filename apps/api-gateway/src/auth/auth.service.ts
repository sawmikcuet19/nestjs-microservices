import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  }

  async register(registerDto: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/register`, registerDto),
    );
    return response.data;
  }

  async login(loginDto: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/login`, loginDto),
    );
    return response.data;
  }

  async getProfile(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.authServiceUrl}/profile`, {
        headers: { 'x-user-id': userId },
      }),
    );
    return response.data;
  }
}