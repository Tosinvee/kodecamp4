/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup-user.dto';
import { UpdatePasswordDto } from './dto/updatepassword.dto';
import { Note, User } from '@prisma/client';


type IUser = Omit<User, 'password'> & {
  notes: Note
}
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signup(user: SignupDto): Promise<{ token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: user.username },
    });

    if (existingUser) {
      throw new BadRequestException(
        `User with username '${existingUser.username}' already exists.`,
      );
    }

    const salt = 10;
    const passwordHash = await bcrypt.hash(user.password, salt);

    const createdUser = await this.prisma.user.create({
      data: {
        ...user,
        password: passwordHash,
      },
    });

    const token = this.jwt.sign({
      id: createdUser.id,
    });

    return { token };
  }

  async signin(user: SignupDto): Promise<{ token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: user.username },
    });

    if (!existingUser) {
      throw new BadRequestException(`Invalid credentials.`);
    }

    const correctPassword = await bcrypt.compare(
      user.password,
      existingUser.password,
    );

    if (!correctPassword) {
      throw new BadRequestException(`Invalid credentials.`);
    }

    return {
      token: this.jwt.sign({
        id: existingUser.id,
      }),
    };
  }

  async me(user: IUser){
    return {user}
}

  async updateUser(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = updatePasswordDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const salt = 10;
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  }

  async deleteUser(userId: string): Promise<void>{
    const user = await this.prisma.user.findUnique({where:{id: userId}})

    if(!user){
      throw new BadRequestException('User nor found')
    }
    // usinf ondelete on the prisma file will delete a note automatically when a user is delected
    await this.prisma.user.delete({
      where: {id : userId}
    })
  }
}



  
    
        
    



