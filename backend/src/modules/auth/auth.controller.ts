import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() data: any) {
    return this.authService.signup(data);
  }

  @Post('register')
  async register(@Body() data: any) {
    return this.authService.signup(data);
  }

  @Post('login')
  async login(@Body() data: any) {
    return this.authService.login(data);
  }

  @Post('change-password')
  async changePassword(@Body() data: any) {
    return this.authService.changePassword(data);
  }

  @Get('invite/:token')
  validateInvite(@Param('token') token: string) {
    return this.authService.validateInviteToken(token);
  }

  @Post('signup-invite')
  signupViaInvite(@Body() body: any) {
    return this.authService.signupViaInvite(body);
  }
}
