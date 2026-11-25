// Run this on your own computer, inside backend/ (so bcryptjs and jsonwebtoken resolve):
//   cp ../Testing/Member-2/Security/security_walkthrough.mjs backend/security_walkthrough.mjs
//   cd backend
//   node security_walkthrough.mjs
// Then screenshot the terminal output and save it as:
//   Testing/Member-2/Security/Evidence/Screenshots/SEC01_bcrypt_jwt_walkthrough.png
// Afterwards, delete backend/security_walkthrough.mjs (it is a one-off demo script,
// not part of the app).

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pw = 'secret1';
const hash1 = await bcrypt.hash(pw, 10);
const hash2 = await bcrypt.hash(pw, 10);
console.log('plaintext:', pw);
console.log('hash #1:  ', hash1);
console.log('hash #2:  ', hash2);
console.log('hashes differ even for the same password (random salt):', hash1 !== hash2);
console.log('compare(correct pw, hash1):', await bcrypt.compare(pw, hash1));
console.log('compare(wrong pw,   hash1):', await bcrypt.compare('wrongpw', hash1));
console.log('');

const secret = 'tutorhub_demo_secret';
const token = jwt.sign({ id: 'u1', role: 'student' }, secret, { expiresIn: '1s' });
console.log('issued token:', token);
console.log('verify with correct secret:', JSON.stringify(jwt.verify(token, secret)));
try { jwt.verify(token, 'wrong_secret'); } catch (e) { console.log('verify with WRONG secret throws:', e.message); }
const tampered = token.slice(0, -4) + 'abcd';
try { jwt.verify(tampered, secret); } catch (e) { console.log('verify TAMPERED token throws:', e.message); }
await new Promise((r) => setTimeout(r, 1200));
try { jwt.verify(token, secret); } catch (e) { console.log('verify EXPIRED token (after 1.2s, maxAge 1s) throws:', e.message); }
