import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,

  ) { }

  async register(dto: RegisterDto, saltRounds = 10) {
    const user = await this.usersService.create(dto, saltRounds);
    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id, email: result.email};
  }

  async validateUser(email: string, plainPassword: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (!isMatch) return null;
    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id, email: result.email };
  }

  async login(user: any) {
    const payload = { id: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
