/// <reference types="../global.d.ts" />
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import test from 'ava';

import { ConfigModule } from '../config';
import { GqlModule } from '../graphql.module';
import { MetricsModule } from '../metrics';
import { AuthModule } from '../modules/auth';
import { AuthService } from '../modules/auth/service';
import { PrismaModule } from '../prisma';
import { RateLimiterModule } from '../throttler';

let auth: AuthService;
let module: TestingModule;

// cleanup database before each test
test.beforeEach(async () => {
  const client = new PrismaClient();
  await client.$connect();
  await client.user.deleteMany({});
  await client.$disconnect();
});

test.beforeEach(async () => {
  module = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        auth: {
          accessTokenExpiresIn: 1,
          refreshTokenExpiresIn: 1,
          leeway: 1,
        },
      }),
      PrismaModule,
      GqlModule,
      AuthModule,
      MetricsModule,
      RateLimiterModule,
    ],
  }).compile();
  auth = module.get(AuthService);
});

test.afterEach(async () => {
  await module.close();
});

test('should be able to register and signIn', async t => {
  await auth.signUp('Alex Yang', 'alexyang@example.org', '123456');
  await auth.signIn('alexyang@example.org', '123456');
  t.pass();
});

test('should be able to verify', async t => {
  await auth.signUp('Alex Yang', 'alexyang@example.org', '123456');
  await auth.signIn('alexyang@example.org', '123456');
  const date = new Date();

  const user = {
    id: '1',
    name: 'Alex Yang',
    email: 'alexyang@example.org',
    emailVerified: date,
    createdAt: date,
    avatarUrl: '',
  };
  {
    const token = await auth.sign(user);
    const claim = await auth.verify(token);
    t.is(claim.id, '1');
    t.is(claim.name, 'Alex Yang');
    t.is(claim.email, 'alexyang@example.org');
    t.is(claim.emailVerified?.toISOString(), date.toISOString());
    t.is(claim.createdAt.toISOString(), date.toISOString());
  }
  {
    const token = await auth.refresh(user);
    const claim = await auth.verify(token);
    t.is(claim.id, '1');
    t.is(claim.name, 'Alex Yang');
    t.is(claim.email, 'alexyang@example.org');
    t.is(claim.emailVerified?.toISOString(), date.toISOString());
    t.is(claim.createdAt.toISOString(), date.toISOString());
  }
});
