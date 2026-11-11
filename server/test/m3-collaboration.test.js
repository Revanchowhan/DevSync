const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-devsync-jwt-key-32chars!!';
process.env.FEATURE_IDEAS = 'true';

const app = require('../src/app');
const User = require('../src/models/User');
const Team = require('../src/models/Team');
const Idea = require('../src/models/Idea');

let mongod;
let tokenStudent1;
let student1Id;
let tokenStudent2;
let student2Id;
let tokenHost;

describe('Milestone 3 — Ideas Hub, Teams Workspace & Collaboration Suite', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Register Student 1
    const res1 = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'Sarah IdeaLeader',
        email: 'sarah.leader@university.edu',
        password: 'password123',
        college: 'Carnegie Mellon',
        branch: 'Information Systems',
        year: 3,
        skills: [{ name: 'React', level: 'Advanced' }],
        bio: 'Product builder and innovator.',
      });
    tokenStudent1 = res1.body.token;
    student1Id = res1.body.user._id;

    // Register Student 2
    const res2 = await request(app)
      .post('/api/auth/register/student')
      .send({
        name: 'David Builder',
        email: 'david.builder@university.edu',
        password: 'password123',
        college: 'Carnegie Mellon',
        branch: 'Computer Science',
        year: 2,
        skills: [{ name: 'Node.js', level: 'Intermediate' }],
        bio: 'Backend enthusiast.',
      });
    tokenStudent2 = res2.body.token;
    student2Id = res2.body.user._id;

    // Register Host
    const resH = await request(app)
      .post('/api/auth/register/host')
      .send({
        name: 'Event Coordinator',
        organization: 'Tech Org',
        email: 'coord@events.com',
        password: 'password123',
      });
    tokenHost = resH.body.token;
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('1. Ideas Hub Lifecycle & State Machine', () => {
    let ideaId;

    it('creates a new idea successfully (Sarah)', async () => {
      const res = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${tokenStudent1}`)
        .send({
          title: 'EcoTrack: Campus Carbon Footprint Tracker',
          description: 'A platform to track and gamify student sustainability efforts on campus.',
          domain: 'Sustainability',
          requiredSkills: [{ name: 'React' }, { name: 'Node.js' }],
          preferredRoles: ['Developer', 'Designer'],
          teamSize: 3,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.idea.title, 'EcoTrack: Campus Carbon Footprint Tracker');
      assert.equal(res.body.idea.status, 'open');
      assert.equal(res.body.idea.members.length, 1);
      ideaId = res.body.idea._id;
    });

    it('lists ideas with filtering by domain and search', async () => {
      const res = await request(app)
        .get('/api/ideas?domain=Sustainability&search=EcoTrack')
        .set('Authorization', `Bearer ${tokenStudent2}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.ideas.length >= 1);
      assert.equal(res.body.ideas[0].title, 'EcoTrack: Campus Carbon Footprint Tracker');
    });

    it('prevents idea owner from expressing interest in own idea (400)', async () => {
      const res = await request(app)
        .post(`/api/ideas/${ideaId}/interest`)
        .set('Authorization', `Bearer ${tokenStudent1}`)
        .send({ message: 'I want to join my own idea' });

      assert.equal(res.status, 400);
    });

    it('allows another student (David) to express interest', async () => {
      const res = await request(app)
        .post(`/api/ideas/${ideaId}/interest`)
        .set('Authorization', `Bearer ${tokenStudent2}`)
        .send({ message: 'I can build the Node.js backend!' });

      assert.equal(res.status, 201);
    });

    it('rejects duplicate pending interest with 409', async () => {
      const res = await request(app)
        .post(`/api/ideas/${ideaId}/interest`)
        .set('Authorization', `Bearer ${tokenStudent2}`)
        .send({ message: 'Applying again' });

      assert.equal(res.status, 409);
    });

    it('prevents non-owner from accepting interest (403)', async () => {
      const res = await request(app)
        .put(`/api/ideas/${ideaId}/interest/${student2Id}`)
        .set('Authorization', `Bearer ${tokenStudent2}`)
        .send({ status: 'accepted' });

      assert.equal(res.status, 403);
    });

    it('allows owner (Sarah) to accept David into the idea members', async () => {
      const res = await request(app)
        .put(`/api/ideas/${ideaId}/interest/${student2Id}`)
        .set('Authorization', `Bearer ${tokenStudent1}`)
        .send({ status: 'accepted' });

      assert.equal(res.status, 200);
      const memberIds = res.body.idea.members.map((m) => m.user.toString());
      assert.ok(memberIds.includes(student2Id.toString()));
    });

    it('converts idea to an official team atomically and idempotently', async () => {
      const res = await request(app)
        .post(`/api/ideas/${ideaId}/convert`)
        .set('Authorization', `Bearer ${tokenStudent1}`);

      assert.equal(res.status, 201);
      assert.ok(res.body.team._id);
      const teamId = res.body.team._id;

      // Check idea status updated to closed
      const updatedIdea = await Idea.findById(ideaId);
      assert.equal(updatedIdea.status, 'closed');
      assert.equal(updatedIdea.convertedTeam.toString(), teamId.toString());

      // Idempotency: calling convert again returns the existing team
      const res2 = await request(app)
        .post(`/api/ideas/${ideaId}/convert`)
        .set('Authorization', `Bearer ${tokenStudent1}`);

      assert.equal(res2.status, 200);
      assert.equal(res2.body.team._id.toString(), teamId.toString());
      assert.equal(res2.body.alreadyConverted, true);
    });
  });

  describe('2. Team Workspace, Tasks & Links Endpoints', () => {
    let teamId;
    let taskId;
    let linkId;

    before(async () => {
      // Create team directly
      const team = await Team.create({
        name: 'Autonomous Drone Swarm',
        description: 'Building AI computer vision for search and rescue.',
        owner: student1Id,
        members: [student1Id, student2Id],
        maxMembers: 4,
      });
      teamId = team._id;
    });

    it('denies workspace access to non-members (403)', async () => {
      // Create a 3rd student
      const res3 = await request(app)
        .post('/api/auth/register/student')
        .send({
          name: 'Stranger Student',
          email: 'stranger@university.edu',
          password: 'password123',
          college: 'MIT',
          branch: 'CS',
          year: 1,
        });
      const tokenStranger = res3.body.token;

      const res = await request(app)
        .get(`/api/teams/${teamId}/workspace`)
        .set('Authorization', `Bearer ${tokenStranger}`);

      assert.equal(res.status, 403);
    });

    it('allows team members to view the workspace', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}/workspace`)
        .set('Authorization', `Bearer ${tokenStudent2}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.workspace.team);
      assert.ok(Array.isArray(res.body.workspace.tasks));
      assert.ok(Array.isArray(res.body.workspace.links));
    });

    it('allows member to add a shared project link', async () => {
      const res = await request(app)
        .post(`/api/teams/${teamId}/links`)
        .set('Authorization', `Bearer ${tokenStudent2}`)
        .send({
          title: 'Figma Architecture Mockups',
          url: 'https://figma.com/file/sample123',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.link.title, 'Figma Architecture Mockups');
      linkId = res.body.link._id;
    });

    it('allows member to create a task assigned to another member', async () => {
      const res = await request(app)
        .post(`/api/teams/${teamId}/tasks`)
        .set('Authorization', `Bearer ${tokenStudent1}`)
        .send({
          title: 'Train YOLOv8 model',
          description: 'Gather drone dataset and train bounding boxes.',
          assignee: student2Id,
          status: 'todo',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.task.title, 'Train YOLOv8 model');
      assert.equal(res.body.task.assignee.toString(), student2Id.toString());
      taskId = res.body.task._id;
    });

    it('allows updating task status to in_progress and done', async () => {
      const res = await request(app)
        .put(`/api/teams/${teamId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenStudent2}`)
        .send({ status: 'done' });

      assert.equal(res.status, 200);
      assert.equal(res.body.task.status, 'done');
    });

    it('enforces leadership transfer rules', async () => {
      // Non-owner cannot transfer
      const failRes = await request(app)
        .put(`/api/teams/${teamId}/transfer`)
        .set('Authorization', `Bearer ${tokenStudent2}`)
        .send({ newLeaderId: student2Id });
      assert.equal(failRes.status, 403);

      // Owner transfers to David
      const okRes = await request(app)
        .put(`/api/teams/${teamId}/transfer`)
        .set('Authorization', `Bearer ${tokenStudent1}`)
        .send({ newLeaderId: student2Id });
      assert.equal(okRes.status, 200);
      assert.equal(okRes.body.team.owner.toString(), student2Id.toString());
    });
  });

  describe('3. Unified Requests Aggregator API (/api/requests/all)', () => {
    it('returns normalized requests array containing team requests, connections, and idea interests', async () => {
      const res = await request(app)
        .get('/api/requests/all')
        .set('Authorization', `Bearer ${tokenStudent1}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.requests));
      // Verify normalized properties are present
      if (res.body.requests.length > 0) {
        const item = res.body.requests[0];
        assert.ok(item._id);
        assert.ok(item.type);
        assert.ok(item.status);
        assert.ok(item.direction);
        assert.ok(item.user);
      }
    });
  });
});
