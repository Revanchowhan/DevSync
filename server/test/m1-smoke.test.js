const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'smoke-test-secret-devsync-32-chars!!';
process.env.NODE_ENV = 'development';

const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;

describe('Milestone 1 — Existing Features Smoke Tests', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  let studentToken = '';
  let studentId = '';
  let student2Token = '';
  let student2Id = '';
  let hostToken = '';
  let hostId = '';
  let hackathonId = '';
  let teamId = '';

  test('POST /api/auth/register/student creates a student and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'Smoke Student',
        email: 'smoke.student@college.edu',
        password: 'password123',
        college: 'Stanford University',
        branch: 'Computer Science',
        year: 3,
        skills: [{ name: 'reactjs', level: 'Advanced' }, { name: 'python', level: 'Intermediate' }],
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'student');
    // Verify skill was normalized to canonical
    assert.equal(res.body.user.skills[0].name, 'React');
    assert.equal(res.body.user.skills[1].name, 'Python');

    studentToken = res.body.token;
    studentId = res.body.user._id || res.body.user.id;
  });

  test('POST /api/auth/register/student creates a second student', async () => {
    const res = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'Second Student',
        email: 'second.student@college.edu',
        password: 'password123',
        college: 'MIT',
        branch: 'EECS',
        year: 2,
        skills: [{ name: 'node.js', level: 'Intermediate' }],
      });

    assert.equal(res.status, 201);
    student2Token = res.body.token;
    student2Id = res.body.user._id || res.body.user.id;
  });

  test('POST /api/auth/register/host creates pending host account', async () => {
    const res = await request(app)
      .post('/api/auth/register/host')
      .send({
        name: 'Event Host',
        organization: 'Tech Innovations Club',
        email: 'host@techclub.org',
        password: 'password123',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.pendingApproval, true);

    // Approve the host in database for the smoke test
    await User.updateOne({ email: 'host@techclub.org' }, { hostStatus: 'approved' });

    // Login as the approved host
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'host@techclub.org',
        password: 'password123',
      });

    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.token);
    hostToken = loginRes.body.token;
    hostId = loginRes.body.user._id || loginRes.body.user.id;
  });

  test('Host creates a hackathon: POST /api/hackathons', async () => {
    const now = new Date();
    const res = await request(app)
      .post('/api/hackathons')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        title: 'DevSync Sprint 2026',
        description: 'Collaborative university sprint for student builders',
        startDate: new Date(now.getTime() + 86400000 * 2).toISOString(),
        endDate: new Date(now.getTime() + 86400000 * 4).toISOString(),
        registrationDeadline: new Date(now.getTime() + 86400000).toISOString(),
        teamFormationDeadline: new Date(now.getTime() + 86400000 * 1.5).toISOString(),
        mode: 'online',
        prize: '$10,000',
        teamSizeLimit: 4,
        requiredSkills: ['React', 'Python'],
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.hackathon._id);
    hackathonId = res.body.hackathon._id;
  });

  test('Student registers for hackathon: POST /api/hackathons/:id/register', async () => {
    const res1 = await request(app)
      .post(`/api/hackathons/${hackathonId}/register`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res1.status, 200);

    const res2 = await request(app)
      .post(`/api/hackathons/${hackathonId}/register`)
      .set('Authorization', `Bearer ${student2Token}`);
    assert.equal(res2.status, 200);
  });

  test('Student creates a team: POST /api/teams', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        hackathonId,
        name: 'Algorithm Avengers',
        description: 'Building AI agents',
        missingSkills: [{ name: 'Node.js' }],
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.team._id);
    teamId = res.body.team._id;
  });

  test('Team owner searches candidates with public serialization', async () => {
    const res = await request(app)
      .get(`/api/teams/search/candidates?hackathonId=${hackathonId}&teamId=${teamId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.candidates));
    assert.equal(res.body.candidates.length, 1);
    const candidate = res.body.candidates[0];
    assert.equal(candidate.user.name, 'Second Student');
    assert.equal(candidate.user.email, undefined); // email must not leak
    assert.equal(candidate.user.passwordHash, undefined);
  });

  test('Team owner sends invite request: POST /api/requests', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        teamId,
        toUserId: student2Id,
        message: 'Join our team for the sprint!',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.request.status, 'pending');
  });

  test('Host exports participant CSV: GET /api/hackathons/:id/participants/export', async () => {
    const res = await request(app)
      .get(`/api/hackathons/${hackathonId}/participants/export`)
      .set('Authorization', `Bearer ${hostToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.text, /Smoke Student/);
    assert.match(res.text, /Second Student/);
  });
});
