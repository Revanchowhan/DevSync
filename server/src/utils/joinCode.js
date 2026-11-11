const crypto = require('crypto');

// Unambiguous alphabet: no 0/O, 1/I/L so codes are easy to read out loud.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateJoinCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

async function generateUniqueJoinCode(TeamModel, length = 6) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateJoinCode(length);
    // eslint-disable-next-line no-await-in-loop
    const exists = await TeamModel.exists({ joinCode: code });
    if (!exists) return code;
  }
  // Astronomically unlikely; the unique index is the final guard.
  return generateJoinCode(10);
}

module.exports = { generateJoinCode, generateUniqueJoinCode };
