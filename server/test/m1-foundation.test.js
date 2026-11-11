const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { validateConfig } = require('../src/utils/config');
const { toPublicStudent, FORBIDDEN_PUBLIC_KEYS } = require('../src/utils/serializers');
const { normalizeSkill, normalizeSkillObject } = require('../src/utils/skills');
const app = require('../src/app');

describe('Milestone 1 — Foundation & Security Gates', () => {
  describe('1. Production Configuration Validation', () => {
    const originalEnv = { ...process.env };

    after(() => {
      process.env = { ...originalEnv };
    });

    test('refuses to start when NODE_ENV=production and JWT_SECRET is missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      process.env.MONGODB_URI = 'mongodb://localhost:27017/prod';
      process.env.ADMIN_EMAILS = 'admin@example.com';

      const res = validateConfig();
      assert.equal(res.valid, false);
      assert.match(res.message, /JWT_SECRET must be securely set/);
    });

    test('refuses to start when NODE_ENV=production and JWT_SECRET is change-me', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'change-me';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/prod';
      process.env.ADMIN_EMAILS = 'admin@example.com';

      const res = validateConfig();
      assert.equal(res.valid, false);
      assert.match(res.message, /cannot be "change-me"/);
    });

    test('refuses to start when NODE_ENV=production and MONGODB_URI is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'super-secret-key-12345';
      delete process.env.MONGODB_URI;
      process.env.ADMIN_EMAILS = 'admin@example.com';

      const res = validateConfig();
      assert.equal(res.valid, false);
      assert.match(res.message, /MONGODB_URI is required in production/);
    });

    test('refuses to start when NODE_ENV=production and ADMIN_EMAILS is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'super-secret-key-12345';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/prod';
      delete process.env.ADMIN_EMAILS;

      const res = validateConfig();
      assert.equal(res.valid, false);
      assert.match(res.message, /ADMIN_EMAILS must be explicitly set in production/);
    });

    test('passes when all required production variables are set', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'valid-production-secret-123';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/prod';
      process.env.ADMIN_EMAILS = 'admin@devsync.local';

      const res = validateConfig();
      assert.equal(res.valid, true);
    });
  });

  describe('2. Public Serializer Leak Test', () => {
    test('never leaks passwordHash, email, googleId, tokens, or admin status', () => {
      const mockRawUser = {
        _id: '507f191e810c19729de860ea',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        passwordHash: '$2b$12$e8iVw6K2wE/XjZ2g1N3cve',
        googleId: 'google-oauth2|1234567890',
        role: 'student',
        college: 'Imperial College',
        branch: 'Computing',
        year: 3,
        skills: [{ name: 'React', level: 'Advanced' }],
        isAdmin: true,
        hostStatus: 'approved',
        hostStatusNote: 'internal note',
        termsAcceptedAt: new Date(),
        verificationToken: 'secret-token-xyz',
        tokens: ['abc', 'def'],
        profileVisibility: 'public',
      };

      const serialized = toPublicStudent(mockRawUser);

      // Verify essential public fields exist
      assert.equal(serialized.name, 'Ada Lovelace');
      assert.equal(serialized.college, 'Imperial College');
      assert.equal(serialized.skills.length, 1);

      // Verify no forbidden keys are present
      for (const forbiddenKey of FORBIDDEN_PUBLIC_KEYS) {
        assert.equal(
          Object.prototype.hasOwnProperty.call(serialized, forbiddenKey),
          false,
          `Forbidden key "${forbiddenKey}" was leaked in public serialization!`
        );
      }
    });

    test('returns null if profileVisibility is hidden', () => {
      const hiddenUser = {
        _id: '507f191e810c19729de860eb',
        name: 'Hidden Student',
        email: 'hidden@example.com',
        profileVisibility: 'hidden',
      };

      const serialized = toPublicStudent(hiddenUser);
      assert.equal(serialized, null);
    });
  });

  describe('3. Skills Taxonomy & Normalization', () => {
    test('normalizes aliases to canonical skill names', () => {
      assert.equal(normalizeSkill('react.js'), 'React');
      assert.equal(normalizeSkill('reactjs'), 'React');
      assert.equal(normalizeSkill('nodejs'), 'Node.js');
      assert.equal(normalizeSkill('node.js'), 'Node.js');
      assert.equal(normalizeSkill('py'), 'Python');
      assert.equal(normalizeSkill('ui/ux'), 'UI/UX Design');
      assert.equal(normalizeSkill('k8s'), 'Kubernetes');
    });

    test('normalizes skill objects with canonical names and valid levels', () => {
      const obj = normalizeSkillObject({ name: 'reactjs', level: 'advanced' });
      assert.deepEqual(obj, { name: 'React', level: 'Advanced' });

      const defaultObj = normalizeSkillObject({ name: 'typescript' });
      assert.deepEqual(defaultObj, { name: 'TypeScript', level: 'Beginner' });
    });
  });

  describe('4. Zod Validation & Request Hardening', () => {
    test('rejects registration with unknown fields (.strict())', async () => {
      const res = await request(app)
        .post('/api/auth/register/student')
        .send({
          name: 'Test Student',
          email: 'test@student.edu',
          password: 'password123',
          college: 'MIT',
          branch: 'CS',
          year: 2,
          skills: [{ name: 'React', level: 'Beginner' }],
          unknownHackerField: 'injection-payload',
        });

      assert.equal(res.status, 400);
      assert.match(res.body.error, /unrecognized|unknown|Validation/i);
    });

    test('rejects login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'pass',
        });

      assert.equal(res.status, 400);
    });
  });

  describe('5. Health Endpoint', () => {
    test('GET /api/health returns devsync-server status', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.service, 'devsync-server');
    });
  });
});
