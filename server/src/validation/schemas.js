const { z } = require('zod');
const { VALID_SKILL_LEVELS } = require('../utils/skills');

const skillSchema = z
  .object({
    name: z.string().trim().min(1, 'Skill name is required').max(50),
    level: z.enum(VALID_SKILL_LEVELS).default('Beginner'),
  })
  .strict();

const registerStudentSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z.string().trim().email('Invalid email address').max(120),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
    college: z.string().trim().min(1, 'College is required').max(150),
    branch: z.string().trim().min(1, 'Branch is required').max(100),
    year: z.coerce.number().int().min(1).max(6),
    skills: z.array(skillSchema).max(30).default([]),
    github: z.string().trim().max(200).optional().default(''),
    linkedin: z.string().trim().max(200).optional().default(''),
    bio: z.string().trim().max(1000).optional().default(''),
    termsAccepted: z.boolean().optional(),
  })
  .strict();

const registerHostSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    organization: z.string().trim().min(1, 'Organization is required').max(150),
    email: z.string().trim().email('Invalid email address').max(120),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
    termsAccepted: z.boolean().optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

const googleAuthSchema = z
  .object({
    idToken: z.string().min(1, 'idToken is required'),
    mode: z.enum(['login', 'signup']).optional(),
    role: z.enum(['student', 'host']).optional(),
    college: z.string().trim().max(150).optional(),
    branch: z.string().trim().max(100).optional(),
    year: z.coerce.number().int().min(1).max(6).optional(),
    skills: z.array(skillSchema).max(30).optional(),
    organization: z.string().trim().max(150).optional(),
  })
  .strict();

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    college: z.string().trim().max(150).optional(),
    university: z.string().trim().max(150).optional(),
    branch: z.string().trim().max(100).optional(),
    year: z.coerce.number().int().min(1).max(6).optional().nullable(),
    skills: z.array(skillSchema).max(30).optional(),
    avatarUrl: z.string().trim().max(500).optional(),
    interests: z.array(z.string().trim().max(50)).max(20).optional(),
    preferredRoles: z
      .array(z.enum(['Developer', 'Designer', 'Data Scientist', 'Researcher', 'Presenter']))
      .max(5)
      .optional(),
    experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    availability: z.enum(['available', 'busy']).optional(),
    pastProjects: z
      .array(
        z.object({
          title: z.string().trim().max(100).optional(),
          description: z.string().trim().max(500).optional(),
          link: z.string().trim().max(300).optional(),
        })
      )
      .max(10)
      .optional(),
    achievements: z.array(z.string().trim().max(100)).max(10).optional(),
    github: z.string().trim().max(200).optional(),
    linkedin: z.string().trim().max(200).optional(),
    bio: z.string().trim().max(1000).optional(),
    profileVisibility: z.enum(['public', 'hidden']).optional(),
    onboardingCompleted: z.boolean().optional(),
  })
  .strict();

const sendConnectionSchema = z
  .object({
    recipientId: z.string().trim().min(1, 'Recipient ID is required'),
    message: z.string().trim().max(500).optional().default(''),
  })
  .strict();

const createIdeaSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(100),
    description: z.string().trim().min(1, 'Description is required').max(2000),
    domain: z.string().trim().min(1, 'Domain is required').max(50),
    requiredSkills: z.array(z.union([skillSchema, z.string()])).max(15).optional(),
    preferredRoles: z
      .array(z.enum(['Developer', 'Designer', 'Data Scientist', 'Researcher', 'Presenter']))
      .max(5)
      .optional(),
    teamSize: z.coerce.number().int().min(2).max(10).optional().default(4),
    hackathonId: z.string().trim().optional().nullable(),
  })
  .strict();

const expressInterestSchema = z
  .object({
    message: z.string().trim().max(500).optional().default(''),
  })
  .strict();

const decideInterestSchema = z
  .object({
    status: z.enum(['accepted', 'declined']),
  })
  .strict();

module.exports = {
  skillSchema,
  registerStudentSchema,
  registerHostSchema,
  loginSchema,
  googleAuthSchema,
  updateProfileSchema,
  sendConnectionSchema,
  createIdeaSchema,
  expressInterestSchema,
  decideInterestSchema,
};
