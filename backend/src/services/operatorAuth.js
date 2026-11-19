// Armazena palavras-passe como derivados scrypt com salt individual; nunca grava o texto recebido.
// scrypt usa módulos nativos do Node; numa integração institucional, bcrypt/Argon2 ou SSO também são opções adequadas.
const { promisify } = require('node:util');
const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string' || !storedHash) return false;
  const [algorithm, salt, expectedHex] = storedHash.split('$');
  if (algorithm !== 'scrypt') {
    // Compatibilidade temporária: após autenticação, server.js converte este valor legado para scrypt.
    const expectedLegacy = Buffer.from(storedHash, 'utf8');
    const actualLegacy = Buffer.from(password, 'utf8');
    return expectedLegacy.length === actualLegacy.length && timingSafeEqual(expectedLegacy, actualLegacy);
  }
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await scryptAsync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };