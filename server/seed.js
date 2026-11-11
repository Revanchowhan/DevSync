/* eslint-disable no-console */
// DevSync seed script — wipes the database and loads demo data in development only.
if (process.env.NODE_ENV === 'production') {
  console.error('[seed] Refusing to seed database in production environment.');
  process.exit(1);
}

//
//   npm run seed
const bcrypt = require('bcrypt');
const { connectDB, disconnectDB } = require('./src/dbConnect');
const User = require('./src/models/User');
const Hackathon = require('./src/models/Hackathon');
const Team = require('./src/models/Team');
const TeamRequest = require('./src/models/TeamRequest');
const Announcement = require('./src/models/Announcement');
const Notification = require('./src/models/Notification');
const { generateUniqueJoinCode } = require('./src/utils/joinCode');

const PASSWORD = 'hackmate123';
const BCRYPT_ROUNDS = 12;

const now = Date.now();
const hours = (n) => new Date(now + n * 60 * 60 * 1000);
const days = (n) => new Date(now + n * 24 * 60 * 60 * 1000);

const STUDENTS = [
  {
    name: 'Aarav Sharma',
    college: 'IIT Bombay',
    branch: 'Computer Science',
    year: 3,
    skills: [
      { name: 'React', level: 'Advanced' },
      { name: 'Node.js', level: 'Intermediate' },
      { name: 'TypeScript', level: 'Intermediate' },
      { name: 'MongoDB', level: 'Intermediate' },
    ],
    github: 'https://github.com/aaravsharma',
    linkedin: 'https://linkedin.com/in/aaravsharma',
    bio: 'Full-stack developer who loves building fast, delightful web apps.',
  },
  {
    name: 'Priya Patel',
    college: 'NIT Trichy',
    branch: 'Electronics and Communication',
    year: 2,
    skills: [
      { name: 'Python', level: 'Advanced' },
      { name: 'Machine Learning', level: 'Intermediate' },
      { name: 'Data Science', level: 'Beginner' },
    ],
    github: 'https://github.com/priyapatel',
    linkedin: 'https://linkedin.com/in/priyapatel',
    bio: 'ML enthusiast exploring NLP and applied deep learning.',
  },
  {
    name: 'Rohan Verma',
    college: 'BITS Pilani',
    branch: 'Computer Science',
    year: 4,
    skills: [
      { name: 'Node.js', level: 'Advanced' },
      { name: 'Go', level: 'Intermediate' },
      { name: 'Docker', level: 'Advanced' },
    ],
    github: 'https://github.com/rohanverma',
    linkedin: 'https://linkedin.com/in/rohanverma',
    bio: 'Backend engineer. I ship containers and sleep well at night.',
  },
  {
    name: 'Sneha Iyer',
    college: 'IIIT Hyderabad',
    branch: 'Computer Science',
    year: 3,
    skills: [
      { name: 'React', level: 'Advanced' },
      { name: 'UI/UX', level: 'Advanced' },
      { name: 'Figma', level: 'Advanced' },
    ],
    github: 'https://github.com/snehaiyer',
    linkedin: 'https://linkedin.com/in/snehaiyer',
    bio: 'Design-minded frontend dev. Pixels are my love language.',
  },
  {
    name: 'Arjun Mehta',
    college: 'VIT Vellore',
    branch: 'Information Technology',
    year: 2,
    skills: [
      { name: 'Flutter', level: 'Intermediate' },
      { name: 'Python', level: 'Beginner' },
      { name: 'MongoDB', level: 'Beginner' },
    ],
    github: 'https://github.com/arjunmehta',
    linkedin: 'https://linkedin.com/in/arjunmehta',
    bio: 'Mobile dev building cross-platform apps with Flutter.',
  },
  {
    name: 'Kavya Reddy',
    college: 'SRM Institute of Science and Technology',
    branch: 'Computer Science',
    year: 1,
    skills: [
      { name: 'Python', level: 'Intermediate' },
      { name: 'React', level: 'Beginner' },
      { name: 'Machine Learning', level: 'Beginner' },
    ],
    github: 'https://github.com/kavyareddy',
    linkedin: 'https://linkedin.com/in/kavyareddy',
    bio: 'First-year coder, hackathon rookie, fast learner.',
  },
  {
    name: 'Aditya Nair',
    college: 'IIT Delhi',
    branch: 'Electrical Engineering',
    year: 3,
    skills: [
      { name: 'Go', level: 'Intermediate' },
      { name: 'Docker', level: 'Intermediate' },
      { name: 'Rust', level: 'Beginner' },
    ],
    github: 'https://github.com/adityanair',
    linkedin: 'https://linkedin.com/in/adityanair',
    bio: 'Systems programmer who enjoys low-level tinkering.',
  },
  {
    name: 'Ishita Singh',
    college: 'Delhi Technological University',
    branch: 'Computer Science',
    year: 4,
    skills: [
      { name: 'TypeScript', level: 'Advanced' },
      { name: 'React', level: 'Advanced' },
      { name: 'Node.js', level: 'Advanced' },
      { name: 'MongoDB', level: 'Intermediate' },
    ],
    github: 'https://github.com/ishitasingh',
    linkedin: 'https://linkedin.com/in/ishitasingh',
    bio: 'Senior dev, hackathon veteran, 6 wins and counting.',
  },
  {
    name: 'Vikram Rao',
    college: 'Manipal Institute of Technology',
    branch: 'Computer Science',
    year: 2,
    skills: [
      { name: 'Solidity', level: 'Intermediate' },
      { name: 'Python', level: 'Intermediate' },
      { name: 'React', level: 'Beginner' },
    ],
    github: 'https://github.com/vikramrao',
    linkedin: 'https://linkedin.com/in/vikramrao',
    bio: 'Web3 builder. Smart contracts by day, hackathons by night.',
  },
  {
    name: 'Ananya Das',
    college: 'Jadavpur University',
    branch: 'Information Technology',
    year: 3,
    skills: [
      { name: 'UI/UX', level: 'Intermediate' },
      { name: 'Figma', level: 'Intermediate' },
      { name: 'React', level: 'Intermediate' },
    ],
    github: 'https://github.com/ananyadas',
    linkedin: 'https://linkedin.com/in/ananyadas',
    bio: 'Designer-developer hybrid crafting intuitive interfaces.',
  },
  {
    name: 'Karthik Menon',
    college: 'Anna University',
    branch: 'Computer Science',
    year: 4,
    skills: [
      { name: 'Machine Learning', level: 'Advanced' },
      { name: 'Python', level: 'Advanced' },
      { name: 'Data Science', level: 'Advanced' },
    ],
    github: 'https://github.com/karthikmenon',
    linkedin: 'https://linkedin.com/in/karthikmenon',
    bio: 'ML researcher turned Kaggle grandmaster aspirant.',
  },
  {
    name: 'Divya Kulkarni',
    college: 'PES University',
    branch: 'Computer Science',
    year: 2,
    skills: [
      { name: 'Flutter', level: 'Beginner' },
      { name: 'UI/UX', level: 'Beginner' },
      { name: 'Python', level: 'Intermediate' },
    ],
    github: 'https://github.com/divyakulkarni',
    linkedin: 'https://linkedin.com/in/divyakulkarni',
    bio: 'Curious builder exploring mobile and design.',
  },
];

async function main() {
  await connectDB();

  console.log('[seed] wiping database…');
  await Promise.all([
    User.deleteMany({}),
    Hackathon.deleteMany({}),
    Team.deleteMany({}),
    TeamRequest.deleteMany({}),
    Announcement.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('[seed] creating users…');
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  const host = await User.create({
    name: 'Demo Organizer',
    organization: 'HackMate Events',
    email: 'host@hackmate.demo',
    passwordHash,
    role: 'host',
    hostStatus: 'approved',
    isAdmin: true, // demo host doubles as the host-approval admin
  });

  const students = [];
  for (let i = 0; i < STUDENTS.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const s = await User.create({
      ...STUDENTS[i],
      email: `student${i + 1}@hackmate.demo`,
      passwordHash,
      role: 'student',
    });
    students.push(s);
  }
  const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12] = students;

  console.log('[seed] creating hackathons…');
  const metaFor = (ids) => {
    const m = new Map();
    ids.forEach((id, i) => m.set(String(id), new Date(now - (ids.length - i) * 36e5)));
    return m;
  };

  // 2 open
  const h1 = await Hackathon.create({
    title: 'CodeSprint 2026',
    description:
      'A 48-hour full-stack sprint. Build, break, and ship something amazing with a team of up to 4.',
    bannerUrl: 'https://images.hackmate.demo/codesprint.jpg',
    startDate: days(40),
    endDate: days(42),
    registrationDeadline: days(30),
    teamFormationDeadline: days(35),
    mode: 'online',
    prize: '₹1,00,000',
    teamSizeLimit: 4,
    requiredSkills: ['React', 'Node.js', 'MongoDB'],
    host: host._id,
    participants: [s1, s2, s3, s4, s5, s6, s7, s8].map((s) => s._id),
    participantMeta: metaFor([s1, s2, s3, s4, s5, s6, s7, s8].map((s) => s._id)),
  });

  const h2 = await Hackathon.create({
    title: 'AI Innovate Hack',
    description:
      'Solve real-world problems with machine learning. Datasets, mentors, and GPU credits provided.',
    startDate: days(50),
    endDate: days(52),
    registrationDeadline: days(45),
    teamFormationDeadline: days(48),
    mode: 'offline',
    venue: 'IIT Bombay, Mumbai',
    prize: '₹2,50,000',
    teamSizeLimit: 4,
    requiredSkills: ['Python', 'Machine Learning', 'Data Science'],
    host: host._id,
    participants: [s2, s3, s6, s9, s11].map((s) => s._id),
    participantMeta: metaFor([s2, s3, s6, s9, s11].map((s) => s._id)),
  });

  // 1 closing within 24h
  const h3 = await Hackathon.create({
    title: 'HackNight Express',
    description:
      'One night. One app. Build a mobile-first prototype before sunrise.',
    startDate: days(3),
    endDate: days(4),
    registrationDeadline: hours(20),
    teamFormationDeadline: days(2),
    mode: 'online',
    prize: '₹50,000',
    teamSizeLimit: 3,
    requiredSkills: ['Flutter', 'UI/UX'],
    host: host._id,
    participants: [s4, s5, s10, s12].map((s) => s._id),
    participantMeta: metaFor([s4, s5, s10, s12].map((s) => s._id)),
  });

  // 2 closed (past deadlines)
  const h4 = await Hackathon.create({
    title: 'WinterCode Fest',
    description: 'Systems and infra hackathon. Go fast, stay up, ship binaries.',
    startDate: days(-70),
    endDate: days(-68),
    registrationDeadline: days(-60),
    teamFormationDeadline: days(-55),
    mode: 'offline',
    venue: 'NIT Trichy',
    prize: '₹1,50,000',
    teamSizeLimit: 4,
    requiredSkills: ['Go', 'Docker', 'Rust'],
    host: host._id,
    participants: [s1, s3, s7].map((s) => s._id),
    participantMeta: metaFor([s1, s3, s7].map((s) => s._id)),
  });

  const h5 = await Hackathon.create({
    title: 'BuildForBharat',
    description: 'Web3 for Bharat — decentralized apps with real social impact.',
    startDate: days(-15),
    endDate: days(-13),
    registrationDeadline: days(-10),
    teamFormationDeadline: days(-8),
    mode: 'online',
    prize: '₹75,000',
    teamSizeLimit: 4,
    requiredSkills: ['Solidity', 'React'],
    host: host._id,
    participants: [s2, s8, s9].map((s) => s._id),
    participantMeta: metaFor([s2, s8, s9].map((s) => s._id)),
  });

  console.log('[seed] creating teams…');
  const t1 = await Team.create({
    hackathon: h1._id,
    name: 'Pixel Pioneers',
    description: 'Frontend-heavy crew hunting for backend + data muscle.',
    owner: s1._id,
    members: [s1._id, s4._id, s8._id],
    missingSkills: [{ name: 'MongoDB' }, { name: 'Docker' }],
    isOpen: true,
    joinCode: await generateUniqueJoinCode(Team),
  });

  const t2 = await Team.create({
    hackathon: h1._id,
    name: 'Full Stack Force',
    description: 'Balanced full-stack squad. Locked and loaded.',
    owner: s2._id,
    members: [s2._id, s3._id, s6._id, s7._id], // 4/4 — full
    missingSkills: [],
    isOpen: false,
    joinCode: await generateUniqueJoinCode(Team),
  });

  const t3 = await Team.create({
    hackathon: h2._id,
    name: 'ML Mavericks',
    description: 'ML-first team looking for design and deployment help.',
    owner: s11._id,
    members: [s11._id, s6._id, s9._id],
    missingSkills: [{ name: 'UI/UX' }, { name: 'Docker' }],
    isOpen: true,
    joinCode: await generateUniqueJoinCode(Team),
  });

  const t4 = await Team.create({
    hackathon: h4._id,
    name: 'Gophers United',
    description: 'Systems hackers from WinterCode Fest.',
    owner: s3._id,
    members: [s3._id, s7._id],
    missingSkills: [],
    isOpen: false,
    joinCode: await generateUniqueJoinCode(Team),
  });

  console.log('[seed] creating team requests…');
  // Pending
  await TeamRequest.create({
    team: t1._id,
    fromUser: s1._id,
    toUser: s6._id,
    message: 'We would love to have you on Pixel Pioneers — your Python + React mix is perfect for us!',
    status: 'pending',
  });
  await TeamRequest.create({
    team: t3._id,
    fromUser: s11._id,
    toUser: s2._id,
    message: 'ML Mavericks needs your data science chops for AI Innovate Hack!',
    status: 'pending',
  });
  // Accepted (consistent with team membership)
  await TeamRequest.create({
    team: t1._id,
    fromUser: s1._id,
    toUser: s8._id,
    message: 'Your TypeScript + React combo is exactly what Pixel Pioneers needs.',
    status: 'accepted',
  });
  await TeamRequest.create({
    team: t2._id,
    fromUser: s2._id,
    toUser: s3._id,
    message: 'Join Full Stack Force — we need your backend firepower.',
    status: 'accepted',
  });
  // Declined
  await TeamRequest.create({
    team: t2._id,
    fromUser: s2._id,
    toUser: s5._id,
    message: 'Want to join Full Stack Force?',
    status: 'declined',
  });

  console.log('[seed] creating announcements + notifications…');
  const a1 = await Announcement.create({
    hackathon: h1._id,
    title: 'Welcome to CodeSprint 2026!',
    body: 'Registrations are open. Form your teams before the team formation deadline and check the required skills list.',
    createdBy: host._id,
  });
  const a2 = await Announcement.create({
    hackathon: h1._id,
    title: 'Judging criteria published',
    body: 'Projects will be judged on innovation (40%), technical depth (30%), and presentation (30%).',
    createdBy: host._id,
  });

  const notifications = [];
  for (const a of [a1, a2]) {
    for (const p of [s1, s2, s3, s4, s5, s6, s7, s8]) {
      notifications.push({
        user: p._id,
        title: `New announcement: ${a.title}`,
        body: a.body,
        type: 'announcement',
        link: `/hackathons/${h1._id}`,
      });
    }
  }
  // Request-related notifications
  notifications.push(
    {
      user: s6._id,
      title: `New team invite: ${t1.name}`,
      body: `You have been invited to join the team "${t1.name}".`,
      type: 'team_request',
      link: '/requests',
    },
    {
      user: s2._id,
      title: `New team invite: ${t3.name}`,
      body: `You have been invited to join the team "${t3.name}".`,
      type: 'team_request',
      link: '/requests',
    },
    {
      user: s1._id,
      title: 'Invite accepted',
      body: `Your invite to "${t1.name}" was accepted.`,
      type: 'request_accepted',
      link: `/teams/${t1._id}`,
    },
    {
      user: s2._id,
      title: 'Invite accepted',
      body: `Your invite to "${t2.name}" was accepted.`,
      type: 'request_accepted',
      link: `/teams/${t2._id}`,
    },
    {
      user: s2._id,
      title: 'Invite declined',
      body: `Your invite to join "${t2.name}" was declined.`,
      type: 'request_declined',
      link: '/requests',
    },
    {
      user: s4._id,
      title: `New teammate joined ${t1.name}`,
      body: 'Ishita Singh joined your team.',
      type: 'team_joined',
      link: `/teams/${t1._id}`,
    },
    {
      user: s6._id,
      title: `New teammate joined ${t2.name}`,
      body: 'Rohan Verma joined your team.',
      type: 'team_joined',
      link: `/teams/${t2._id}`,
    }
  );
  await Notification.insertMany(notifications);

  console.log('[seed] done.');
  console.log(`[seed] host: ${host.email}, students: ${students.length}, hackathons: 5, teams: 4`);
  console.log('');
  console.log('host@hackmate.demo / hackmate123');
  console.log('student1@hackmate.demo ... student12@hackmate.demo / hackmate123');

  await disconnectDB();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('[seed] failed:', err);
  await disconnectDB();
  process.exit(1);
});
