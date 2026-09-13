import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import { AuthService } from './auth-service.service';
import { RegisterDto, LoginDto } from '@app/common';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  getProfile(@Headers('x-user-id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
