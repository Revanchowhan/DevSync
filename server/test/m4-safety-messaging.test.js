const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-devsync-jwt-key-32chars!!';
process.env.FEATURE_MESSAGING = 'true';

const app = require('../src/app');
const User = require('../src/models/User');
const Connection = require('../src/models/Connection');
const Team = require('../src/models/Team');
const Block = require('../src/models/Block');

let mongod;
let tokenAlice;
let aliceId;
let tokenBob;
let bobId;
let tokenCharlie;
let charlieId;

describe('Milestone 4 — Messaging, Safety & Verification Suite', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Register Alice
    const resA = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'Alice Stanford',
        email: 'alice@stanford.edu',
        password: 'password123',
        college: 'Stanford University',
        branch: 'Computer Science',
        year: 3,
        skills: [{ name: 'React' }],
      });
    tokenAlice = resA.body.token;
    aliceId = resA.body.user._id;

    // Register Bob
    const resB = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'Bob Berkeley',
        email: 'bob@berkeley.edu',
        password: 'password123',
        college: 'UC Berkeley',
        branch: 'EECS',
        year: 4,
        skills: [{ name: 'Python' }],
      });
    tokenBob = resB.body.token;
    bobId = resB.body.user._id;

    // Register Charlie (unconnected student)
    const resC = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'Charlie Caltech',
        email: 'charlie@caltech.edu',
        password: 'password123',
        college: 'Caltech',
        branch: 'Physics',
        year: 2,
        skills: [{ name: 'Rust' }],
      });
    tokenCharlie = resC.body.token;
    charlieId = resC.body.user._id;

    // Make Alice and Bob accepted connections
    const r1 = aliceId.toString();
    const r2 = bobId.toString();
    await Connection.create({
      requester: aliceId,
      recipient: bobId,
      userLow: r1 < r2 ? aliceId : bobId,
      userHigh: r1 < r2 ? bobId : aliceId,
      status: 'accepted',
    });
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('1. Direct & Team Messaging Lifecycle', () => {
    let directConvId;
    let teamConvId;
    let teamId;

    it('denies direct chat between non-connected students (Alice and Charlie) with 403', async () => {
      const res = await request(app)
        .post('/api/conversations/direct')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: charlieId });

      assert.equal(res.status, 403);
    });

    it('allows accepted connections (Alice and Bob) to create or get direct conversation', async () => {
      const res = await request(app)
        .post('/api/conversations/direct')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: bobId });

      assert.equal(res.status, 200);
      assert.ok(res.body.conversation._id);
      assert.equal(res.body.conversation.type, 'direct');
      directConvId = res.body.conversation._id;
    });

    it('allows Alice to send a message to Bob', async () => {
      const res = await request(app)
        .post(`/api/conversations/${directConvId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ text: 'Hey Bob! Ready to team up for TreeHacks?' });

      assert.equal(res.status, 201);
      assert.equal(res.body.message.text, 'Hey Bob! Ready to team up for TreeHacks?');
      assert.equal(res.body.message.sender._id.toString(), aliceId.toString());
    });

    it('allows Bob to retrieve messages in the conversation', async () => {
      const res = await request(app)
        .get(`/api/conversations/${directConvId}/messages`)
        .set('Authorization', `Bearer ${tokenBob}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.messages.length, 1);
      assert.equal(res.body.messages[0].text, 'Hey Bob! Ready to team up for TreeHacks?');
    });

    it('reports unread messages for Bob and marks as read', async () => {
      // Bob checks conversations list
      const listRes = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${tokenBob}`);

      assert.equal(listRes.status, 200);
      const conv = listRes.body.conversations.find((c) => c._id.toString() === directConvId.toString());
      assert.ok(conv);
      assert.equal(conv.unreadCount, 1);

      // Bob marks as read
      const readRes = await request(app)
        .post(`/api/conversations/${directConvId}/read`)
        .set('Authorization', `Bearer ${tokenBob}`);
      assert.equal(readRes.status, 200);

      // Check unread count is now 0
      const listRes2 = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${tokenBob}`);
      const conv2 = listRes2.body.conversations.find((c) => c._id.toString() === directConvId.toString());
      assert.equal(conv2.unreadCount, 0);
    });

    it('team chat access control: non-members denied (403), members allowed', async () => {
      // Create a team with Alice and Bob
      const team = await Team.create({
        name: 'Quantum Hackers',
        owner: aliceId,
        members: [aliceId, bobId],
      });
      teamId = team._id;

      // Charlie (non-member) tries to access team chat
      const failRes = await request(app)
        .post(`/api/conversations/team/${teamId}`)
        .set('Authorization', `Bearer ${tokenCharlie}`);
      assert.equal(failRes.status, 403);

      // Alice (member) accesses team chat
      const okRes = await request(app)
        .post(`/api/conversations/team/${teamId}`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      assert.equal(okRes.status, 200);
      assert.equal(okRes.body.conversation.type, 'team');
      teamConvId = okRes.body.conversation._id;

      // Alice sends message in team chat
      const msgRes = await request(app)
        .post(`/api/conversations/${teamConvId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ text: 'Welcome to the team chat everyone!' });
      assert.equal(msgRes.status, 201);
    });
  });

  describe('2. Safety, Reporting & Cross-Feature Blocking', () => {
    it('submits a user report successfully', async () => {
      const res = await request(app)
        .post('/api/safety/report')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({
          targetUserId: charlieId,
          reason: 'spam',
          details: 'Sending unsolicited messages.',
        });

      assert.equal(res.status, 201);
      assert.ok(res.body.report._id);
    });

    it('prevents self-reporting with 400', async () => {
      const res = await request(app)
        .post('/api/safety/report')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({
          targetUserId: aliceId,
          reason: 'other',
        });

      assert.equal(res.status, 400);
    });

    it('blocks a user (Alice blocks Bob)', async () => {
      const res = await request(app)
        .post('/api/safety/block')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ targetUserId: bobId });

      assert.equal(res.status, 201);
      assert.equal(res.body.message, 'User blocked successfully.');
    });

    it('verifies blocking is enforced across discovery (neither can see the other)', async () => {
      const resAlice = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${tokenAlice}`);

      const aliceSees = resAlice.body.students.map((s) => s._id.toString());
      assert.ok(!aliceSees.includes(bobId.toString()), 'Alice should not see blocked Bob in discovery');

      const resBob = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${tokenBob}`);

      const bobSees = resBob.body.students.map((s) => s._id.toString());
      assert.ok(!bobSees.includes(aliceId.toString()), 'Bob should not see Alice who blocked him');
    });

    it('verifies blocking prevents connection requests in both directions (403)', async () => {
      // Bob tries to connect with Alice
      const res1 = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ recipientId: aliceId, message: 'Unblock me please' });

      assert.equal(res1.status, 403);

      // Alice tries to connect with Bob
      const res2 = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: bobId, message: 'Connecting' });

      assert.equal(res2.status, 403);
    });

    it('verifies blocking disables direct messaging in both directions (403)', async () => {
      const res1 = await request(app)
        .post('/api/conversations/direct')
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ recipientId: aliceId });

      assert.equal(res1.status, 403);

      const res2 = await request(app)
        .post('/api/conversations/direct')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: bobId });

      assert.equal(res2.status, 403);
    });
  });

  describe('3. College Email Verification Flow', () => {
    let verificationToken;

    it('rejects verification for non-academic email with 400', async () => {
      const res = await request(app)
        .post('/api/safety/verify-email/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ collegeEmail: 'alice@gmail.com' });

      assert.equal(res.status, 400);
      assert.ok(res.body.error.includes('.edu'));
    });

    it('generates a verification token for university student email', async () => {
      const res = await request(app)
        .post('/api/safety/verify-email/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ collegeEmail: 'alice.scholar@stanford.edu' });

      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      verificationToken = res.body.token;
    });

    it('confirms email verification with valid token and sets emailVerified = true', async () => {
      const res = await request(app)
        .post('/api/safety/verify-email/confirm')
        .send({ token: verificationToken });

      assert.equal(res.status, 200);
      assert.equal(res.body.verified, true);

      // Verify DB state
      const user = await User.findById(aliceId);
      assert.equal(user.emailVerified, true);
    });
  });

  describe('4. Secure Account Deletion', () => {
    it('refuses deletion with incorrect password (401)', async () => {
      const res = await request(app)
        .delete('/api/safety/account')
        .set('Authorization', `Bearer ${tokenCharlie}`)
        .send({ password: 'wrong-password' });

      assert.equal(res.status, 401);
    });

    it('permanently deletes account with valid password (Charlie)', async () => {
      const res = await request(app)
        .delete('/api/safety/account')
        .set('Authorization', `Bearer ${tokenCharlie}`)
        .send({ password: 'password123' });

      assert.equal(res.status, 200);
      assert.equal(res.body.message, 'Account permanently deleted.');

      const deleted = await User.findById(charlieId);
      assert.equal(deleted, null);
    });
  });
});
