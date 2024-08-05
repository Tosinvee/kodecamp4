/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module'; // Adjust the path as needed
import { PrismaService } from '../prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const randomString = () => Math.random().toString(36).substring(2, 15);
  
  const signupDto = () => ({
    username: `testuser_${randomString()}`,
    password: 'testpassword',
  });

  const updatePasswordDto = {
    currentPassword: 'testpassword',
    newPassword: 'newpassword',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    await prismaService.note.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('/auth/signup (POST) should create a new user and return a token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(signupDto())
      .expect(201)
      .catch(err => {
        throw err;
      });

    expect(response.body).toHaveProperty('token');
  });

  it('/auth/signin (POST) should sign in and return a token', async () => {
    const userDto = signupDto();
    // Create a user first
    const passwordHash = await bcrypt.hash(userDto.password, 10);
    await prismaService.user.create({
      data: {
        username: userDto.username,
        password: passwordHash,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(userDto)
      .expect(201);

    expect(response.body).toHaveProperty('token');
  });

  it('/auth/me (GET) should return the current user', async () => {
    const userDto = signupDto();
    // Create a user and get a token
    const passwordHash = await bcrypt.hash(userDto.password, 10);
    const user = await prismaService.user.create({
      data: {
        username: userDto.username,
        password: passwordHash,
      },
    });
    const token = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(userDto)
      .then(response => response.body.token);

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.user).toHaveProperty('username', userDto.username);
  });

  it('/auth/signout (GET) should sign out the user', async () => {
    const userDto = signupDto();
    // Create a user and get a token
    const passwordHash = await bcrypt.hash(userDto.password, 10);
    const user = await prismaService.user.create({
      data: {
        username: userDto.username,
        password: passwordHash,
      },
    });
    const token = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(userDto)
      .then(response => response.body.token);

    const response = await request(app.getHttpServer())
      .get('/auth/signout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('token', null);
  });

  it('/auth/update (PATCH) should update the user password', async () => {
    const userDto = signupDto();
    // Create a user and get a token
    const passwordHash = await bcrypt.hash(userDto.password, 10);
    const user = await prismaService.user.create({
      data: {
        username: userDto.username,
        password: passwordHash,
      },
    });
    const token = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(userDto)
      .then(response => response.body.token);

    // Update password
    const response = await request(app.getHttpServer())
      .patch('/auth/update')
      .set('Authorization', `Bearer ${token}`)
      .send(updatePasswordDto)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Password updated successfully');
  });

  afterAll(async () => {
    await app.close();
  });
});
