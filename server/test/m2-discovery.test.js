const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Ensure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-devsync-jwt-key-32chars!!';

const app = require('../src/app');
const User = require('../src/models/User');
const Connection = require('../src/models/Connection');
const { calculateMatch, WEIGHTS, TOTAL_WEIGHT } = require('../src/services/matching');
const { calculateProfileCompletion } = require('../src/utils/profileCompletion');
const { runBackfill } = require('../scripts/backfill');

let mongod;
let tokenStudentA;
let studentAId;
let tokenStudentB;
let studentBId;
let tokenStudentC;
let studentCId;

describe('Milestone 2 — Discovery & Connections Suite', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Register Student A
    const resA = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'Alice Pythonista',
        email: 'alice@university.edu',
        password: 'password123',
        college: 'MIT University',
        branch: 'Computer Science',
        year: 3,
        skills: [{ name: 'Python', level: 'Advanced' }, { name: 'Machine Learning', level: 'Intermediate' }],
        bio: 'Passionate about AI and data engineering.',
      });
    assert.equal(resA.status, 201);
    tokenStudentA = resA.body.token;
    studentAId = resA.body.user._id;

    // Register Student B
    const resB = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'Bob Frontend',
        email: 'bob@university.edu',
        password: 'password123',
        college: 'Stanford College',
        branch: 'Software Engineering',
        year: 2,
        skills: [{ name: 'React', level: 'Advanced' }, { name: 'Tailwind CSS', level: 'Advanced' }, { name: 'UI/UX', level: 'Intermediate' }],
        bio: 'Frontend architect and design enthusiast.',
      });
    assert.equal(resB.status, 201);
    tokenStudentB = resB.body.token;
    studentBId = resB.body.user._id;

    // Register Student C (Hidden profile)
    const resC = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'Charlie Stealth',
        email: 'charlie@university.edu',
        password: 'password123',
        college: 'MIT University',
        branch: 'Cybersecurity',
        year: 4,
        skills: [{ name: 'Security', level: 'Advanced' }],
        bio: 'Incognito developer.',
      });
    assert.equal(resC.status, 201);
    tokenStudentC = resC.body.token;
    studentCId = resC.body.user._id;

    // Update Student C to hidden visibility
    await User.findByIdAndUpdate(studentCId, { profileVisibility: 'hidden' });
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('1. Explainable Matching Pure Function Unit Tests', () => {
    it('weights must sum to exactly 100', () => {
      assert.equal(TOTAL_WEIGHT, 100);
      assert.equal(WEIGHTS.complementarity, 40);
      assert.equal(WEIGHTS.interests, 20);
      assert.equal(WEIGHTS.roleFit, 20);
      assert.equal(WEIGHTS.availability, 10);
      assert.equal(WEIGHTS.experience, 10);
    });

    it('returns score 0 and safe breakdown for empty target or candidate', () => {
      const matchNull = calculateMatch(null, null);
      assert.equal(matchNull.score, 0);
      assert.ok(matchNull.reason);
      assert.equal(matchNull.breakdown.complementarity, 0);

      const matchEmpty = calculateMatch({}, {});
      assert.ok(matchEmpty.score >= 0);
      assert.ok(typeof matchEmpty.reason === 'string');
    });

    it('produces deterministic output for identical inputs', () => {
      const target = {
        skills: ['Python', 'Docker'],
        interests: ['AI', 'Fintech'],
        preferredRoles: ['Developer'],
        availability: 'available',
        experienceLevel: 'Intermediate',
      };
      const candidate = {
        skills: ['React', 'Figma'],
        interests: ['AI', 'Web3'],
        preferredRoles: ['Designer'],
        availability: 'available',
        experienceLevel: 'Intermediate',
      };

      const run1 = calculateMatch(target, candidate);
      const run2 = calculateMatch(target, candidate);
      assert.deepEqual(run1, run2);
      assert.ok(run1.score >= 70, 'Complementary skills + roles + shared interest should score high');
      assert.ok(run1.reason.includes('Python') || run1.reason.includes('React') || run1.reason.includes('Strong match'));
    });
  });

  describe('2. Profile Completion Utility Tests', () => {
    it('calculates 100% for a fully populated profile', () => {
      const fullProfile = {
        name: 'Full Dev',
        university: 'MIT',
        branch: 'CS',
        year: 3,
        skills: [{ name: 'Go' }],
        preferredRoles: ['Developer'],
        interests: ['Robotics'],
        bio: 'Full biography with more than ten characters.',
        avatarUrl: 'https://example.com/avatar.png',
        github: 'https://github.com/fulldev',
      };
      assert.equal(calculateProfileCompletion(fullProfile), 100);
    });

    it('returns proportional score for partial profile', () => {
      const partialProfile = {
        name: 'Minimal Dev',
        skills: [{ name: 'JavaScript' }],
      };
      const score = calculateProfileCompletion(partialProfile);
      assert.equal(score, 30); // Name (10) + Skills (20)
    });
  });

  describe('3. Student Discovery API (GET /api/students)', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/students');
      assert.equal(res.status, 401);
    });

    it('returns public students with match info and excludes hidden profiles', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.students));
      // Should include Bob (studentB), but exclude Alice (current user) and Charlie (hidden)
      const ids = res.body.students.map((s) => s._id.toString());
      assert.ok(ids.includes(studentBId.toString()), 'Bob should be discoverable');
      assert.ok(!ids.includes(studentAId.toString()), 'Current user should not be in discovery');
      assert.ok(!ids.includes(studentCId.toString()), 'Hidden user should be excluded');

      // Verify no sensitive fields leaked
      const bob = res.body.students.find((s) => s._id.toString() === studentBId.toString());
      assert.equal(bob.email, undefined);
      assert.equal(bob.passwordHash, undefined);
      assert.ok(bob.match);
      assert.ok(typeof bob.match.score === 'number');
      assert.ok(bob.match.reason);
    });

    it('filters accurately by skill', async () => {
      const res = await request(app)
        .get('/api/students?skills=React')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.students.length > 0);
      assert.equal(res.body.students[0]._id.toString(), studentBId.toString());
    });

    it('handles search and college filtering simultaneously without overwriting', async () => {
      const res = await request(app)
        .get('/api/students?search=Frontend&college=Stanford')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.students.length, 1);
      assert.equal(res.body.students[0].name, 'Bob Frontend');
    });

    it('supports cursor pagination', async () => {
      const res = await request(app)
        .get('/api/students?limit=1')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.students.length, 1);
      assert.ok('nextCursor' in res.body);
    });
  });

  describe('4. Connections Lifecycle API (/api/connections)', () => {
    let connectionId;

    it('prevents self-connection request with 400', async () => {
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ recipientId: studentAId, message: 'Hello me' });

      assert.equal(res.status, 400);
    });

    it('creates a connection request successfully (Alice -> Bob)', async () => {
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ recipientId: studentBId, message: 'Would love to team up for upcoming hackathon!' });

      assert.equal(res.status, 201);
      assert.equal(res.body.connection.status, 'pending');
      assert.equal(res.body.connection.requester.toString(), studentAId.toString());
      connectionId = res.body.connection._id;
    });

    it('rejects duplicate pending connection request with 409', async () => {
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ recipientId: studentBId, message: 'Trying again' });

      assert.equal(res.status, 409);
    });

    it('prevents non-recipient from accepting connection with 403', async () => {
      const res = await request(app)
        .put(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenStudentA}`); // Alice is requester, not recipient

      assert.equal(res.status, 403);
    });

    it('allows recipient to accept connection (Bob accepts)', async () => {
      const res = await request(app)
        .put(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenStudentB}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.connection.status, 'accepted');
    });

    it('rejects duplicate connection when already accepted with 409', async () => {
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ recipientId: studentBId });

      assert.equal(res.status, 409);
    });

    it('allows participant to remove accepted connection', async () => {
      const res = await request(app)
        .delete(`/api/connections/${connectionId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.message, 'Connection removed.');
    });

    it('enforces 24-hour cooldown after cancellation/removal', async () => {
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ recipientId: studentBId });

      assert.equal(res.status, 409);
      assert.ok(res.body.error && res.body.error.includes('cooldown'));
    });
  });

  describe('5. Backfill Script Idempotency', () => {
    it('running backfill twice results in 0 updates on the second run', async () => {
      const firstRun = await runBackfill();
      assert.ok(firstRun >= 0);

      const secondRun = await runBackfill();
      assert.equal(secondRun, 0, 'Second run must update 0 records');
    });
  });
});
