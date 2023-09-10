import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import ava, { TestFn } from 'ava';
// @ts-expect-error graphql-upload is not typed
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';

import { AppModule } from '../app';
import { MailService } from '../modules/auth/mailer';
import { AuthService } from '../modules/auth/service';
import {
  acceptInvite,
  acceptInviteById,
  createWorkspace,
  getCurrentMailMessageCount,
  getLatestMailMessage,
  getWorkspace,
  inviteUser,
  leaveWorkspace,
  revokeUser,
  signUp,
} from './utils';

const test = ava as TestFn<{
  app: INestApplication;
  client: PrismaClient;
  auth: AuthService;
  mail: MailService;
}>;

test.beforeEach(async t => {
  const client = new PrismaClient();
  t.context.client = client;
  await client.$connect();
  await client.user.deleteMany({});
  await client.snapshot.deleteMany({});
  await client.update.deleteMany({});
  await client.workspace.deleteMany({});
  await client.$disconnect();
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication();
  app.use(
    graphqlUploadExpress({
      maxFileSize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );
  await app.init();

  const auth = module.get(AuthService);
  const mail = module.get(MailService);
  t.context.app = app;
  t.context.auth = auth;
  t.context.mail = mail;
});

test.afterEach(async t => {
  await t.context.app.close();
});

test('should invite a user', async t => {
  const { app } = t.context;
  const u1 = await signUp(app, 'u1', 'u1@affine.pro', '1');
  const u2 = await signUp(app, 'u2', 'u2@affine.pro', '1');

  const workspace = await createWorkspace(app, u1.token.token);

  const invite = await inviteUser(
    app,
    u1.token.token,
    workspace.id,
    u2.email,
    'Admin'
  );
  t.truthy(invite, 'failed to invite user');
});

test('should accept an invite', async t => {
  const { app } = t.context;
  const u1 = await signUp(app, 'u1', 'u1@affine.pro', '1');
  const u2 = await signUp(app, 'u2', 'u2@affine.pro', '1');

  const workspace = await createWorkspace(app, u1.token.token);
  await inviteUser(app, u1.token.token, workspace.id, u2.email, 'Admin');

  const accept = await acceptInvite(app, u2.token.token, workspace.id);
  t.is(accept, true, 'failed to accept invite');

  const currWorkspace = await getWorkspace(app, u1.token.token, workspace.id);
  const currMember = currWorkspace.members.find(u => u.email === u2.email);
  t.not(currMember, undefined, 'failed to invite user');
  t.is(currMember!.id, u2.id, 'failed to invite user');
  t.true(!currMember!.accepted, 'failed to invite user');
  t.pass();
});

test('should leave a workspace', async t => {
  const { app } = t.context;
  const u1 = await signUp(app, 'u1', 'u1@affine.pro', '1');
  const u2 = await signUp(app, 'u2', 'u2@affine.pro', '1');

  const workspace = await createWorkspace(app, u1.token.token);
  await inviteUser(app, u1.token.token, workspace.id, u2.email, 'Admin');
  await acceptInvite(app, u2.token.token, workspace.id);

  const leave = await leaveWorkspace(app, u2.token.token, workspace.id);

  t.pass();
  t.true(leave, 'failed to leave workspace');
});

test('should revoke a user', async t => {
  const { app } = t.context;
  const u1 = await signUp(app, 'u1', 'u1@affine.pro', '1');
  const u2 = await signUp(app, 'u2', 'u2@affine.pro', '1');

  const workspace = await createWorkspace(app, u1.token.token);
  await inviteUser(app, u1.token.token, workspace.id, u2.email, 'Admin');

  const currWorkspace = await getWorkspace(app, u1.token.token, workspace.id);
  t.is(currWorkspace.members.length, 2, 'failed to invite user');

  const revoke = await revokeUser(app, u1.token.token, workspace.id, u2.id);
  t.true(revoke, 'failed to revoke user');
});

test('should create user if not exist', async t => {
  const { app, auth } = t.context;
  const u1 = await signUp(app, 'u1', 'u1@affine.pro', '1');

  const workspace = await createWorkspace(app, u1.token.token);

  await inviteUser(app, u1.token.token, workspace.id, 'u2@affine.pro', 'Admin');

  const user = await auth.getUserByEmail('u2@affine.pro');
  t.not(user, undefined, 'failed to create user');
  t.is(user?.name, 'Unnamed', 'failed to create user');
});

test('should invite a user by link', async t => {
  const { app } = t.context;
  const u1 = await signUp(app, 'u1', 'u1@affine.pro', '1');
  const u2 = await signUp(app, 'u2', 'u2@affine.pro', '1');

  const workspace = await createWorkspace(app, u1.token.token);

  const invite = await inviteUser(
    app,
    u1.token.token,
    workspace.id,
    u2.email,
    'Admin'
  );

  const accept = await acceptInviteById(app, workspace.id, invite);
  t.true(accept, 'failed to accept invite');

  const invite1 = await inviteUser(
    app,
    u1.token.token,
    workspace.id,
    u2.email,
    'Admin'
  );

  t.is(invite, invite1, 'repeat the invitation must return same id');

  const currWorkspace = await getWorkspace(app, u1.token.token, workspace.id);
  const currMember = currWorkspace.members.find(u => u.email === u2.email);
  t.not(currMember, undefined, 'failed to invite user');
  t.is(currMember?.inviteId, invite, 'failed to check invite id');
});

test('should send email', async t => {
  const { mail, app } = t.context;
  if (mail.hasConfigured()) {
    const u1 = await signUp(app, 'u1', 'u1@affine.pro', '1');
    const u2 = await signUp(app, 'test', 'production@toeverything.info', '1');

    const workspace = await createWorkspace(app, u1.token.token);
    const primitiveMailCount = await getCurrentMailMessageCount();

    const invite = await inviteUser(
      app,
      u1.token.token,
      workspace.id,
      u2.email,
      'Admin',
      true
    );

    const afterInviteMailCount = await getCurrentMailMessageCount();
    t.is(
      primitiveMailCount + 1,
      afterInviteMailCount,
      'failed to send invite email'
    );
    const inviteEmailContent = await getLatestMailMessage();

    t.not(
      // @ts-expect-error Third part library type mismatch
      inviteEmailContent.To.find(item => {
        return item.Mailbox === 'production';
      }),
      undefined,
      'invite email address was incorrectly sent'
    );

    const accept = await acceptInviteById(app, workspace.id, invite, true);
    t.true(accept, 'failed to accept invite');

    const afterAcceptMailCount = await getCurrentMailMessageCount();
    t.is(
      afterInviteMailCount + 1,
      afterAcceptMailCount,
      'failed to send accepted email to owner'
    );
    const acceptEmailContent = await getLatestMailMessage();
    t.not(
      // @ts-expect-error Third part library type mismatch
      acceptEmailContent.To.find(item => {
        return item.Mailbox === 'u1';
      }),
      undefined,
      'accept email address was incorrectly sent'
    );

    await leaveWorkspace(app, u2.token.token, workspace.id, true);

    const afterLeaveMailCount = await getCurrentMailMessageCount();
    t.is(
      afterAcceptMailCount + 1,
      afterLeaveMailCount,
      'failed to send leave email to owner'
    );
    const leaveEmailContent = await getLatestMailMessage();
    t.not(
      // @ts-expect-error Third part library type mismatch
      leaveEmailContent.To.find(item => {
        return item.Mailbox === 'u1';
      }),
      undefined,
      'leave email address was incorrectly sent'
    );
  }
  t.pass();
});
