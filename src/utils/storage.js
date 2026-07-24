// Thin wrapper around localStorage.
//
// Two things layered on top of a plain key/value store:
//
// 1. NAMESPACING. Every key is prefixed so this app never collides with
//    anything else stored on the same origin.
// 2. PER-USER SCOPING for saved presets. Once someone signs in with Google,
//    their saved QR presets are stored under a key scoped to *their*
//    account (Google `sub`, falling back to email) via getUserStorage, so
//    multiple people signing in on the same browser/device don't see or
//    overwrite each other's presets.
//
// This is intentionally simple — plain localStorage, JSON in/out. Nothing
// here is sent to a server; "signing in" only ever identifies whose bucket
// of *local* presets to read.

const PREFIX = "qrb_";

export function isStorageAvailable() {
  try {
    const testKey = `${PREFIX}__test__`;
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getStorage(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

// --- Per-user scoping, used for saved QR presets ---

function userScope(user) {
  return user?.sub || user?.email || "guest";
}

export function getUserStorage(user, key) {
  return getStorage(`${userScope(user)}:${key}`);
}

export function setUserStorage(user, key, value) {
  return setStorage(`${userScope(user)}:${key}`, value);
}

export function removeUserStorage(user, key) {
  removeStorage(`${userScope(user)}:${key}`);
}
