import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User, UserSchema } from './entities/user.entity';
import { PhotoHistory, PhotoHistorySchema } from './entities/photo-history.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  MongooseModule.forFeature([{ name: PhotoHistory.name, schema: PhotoHistorySchema }])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
