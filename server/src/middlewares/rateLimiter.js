const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_TIME_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

function getLoginKey(req) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  return email ? `${req.ip}:${email}` : req.ip;
}

function getLoginRecord(key) {
  const record = loginAttempts.get(key) || { attempts: 0, blockedUntil: 0 };

  if (record.blockedUntil && record.blockedUntil <= Date.now()) {
    loginAttempts.delete(key);
    return { attempts: 0, blockedUntil: 0 };
  }

  return record;
}

export function isLoginBlocked(req) {
  const key = getLoginKey(req);
  const record = getLoginRecord(key);
  return record.blockedUntil > Date.now();
}

export function recordLoginAttempt(req, success) {
  const key = getLoginKey(req);

  if (success) {
    loginAttempts.delete(key);
    return;
  }

  const record = getLoginRecord(key);
  record.attempts += 1;

  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = Date.now() + BLOCK_TIME_MS;
  }

  loginAttempts.set(key, record);
}
