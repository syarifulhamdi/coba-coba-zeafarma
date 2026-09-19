/**
 * Dashboard accounts, defined entirely in the environment so no credential
 * ever lives in the repository.
 *
 * DASHBOARD_USERS holds a JSON array:
 *   [{"username":"admin","password":"...","name":"Administrator"}]
 *
 * Passwords are compared, not hashed, which matches how the rest of the
 * deployment stores secrets (encrypted at rest in the host's env store, only
 * readable by the project owner). It is a shared internal dashboard with no
 * self-service signup, so there is no password database to breach — but treat
 * the env value itself as the credential store it is.
 */

export interface DashboardUser {
  username: string;
  name: string;
}

interface StoredUser extends DashboardUser {
  password: string;
}

function parseUsers(): StoredUser[] {
  const raw = process.env.DASHBOARD_USERS;
  if (!raw || raw.trim() === "") {
    throw new Error(
      "DASHBOARD_USERS is not set. Add a JSON array of accounts, e.g. " +
        '[{"username":"admin","password":"...","name":"Administrator"}]'
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("DASHBOARD_USERS is not valid JSON. Expected an array of {username, password, name}.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("DASHBOARD_USERS must be a JSON array of {username, password, name}.");
  }

  const users: StoredUser[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const { username, password, name } = entry as Record<string, unknown>;
    if (typeof username !== "string" || typeof password !== "string") continue;
    if (username.trim() === "" || password === "") continue;
    users.push({
      username: username.trim(),
      password,
      name: typeof name === "string" && name.trim() !== "" ? name.trim() : username.trim(),
    });
  }

  if (users.length === 0) {
    throw new Error("DASHBOARD_USERS contains no usable accounts (each needs a username and password).");
  }
  return users;
}

function timingSafeEqual(a: string, b: string): boolean {
  // Compare over a fixed length so the loop count does not reveal which input
  // was shorter; the length check is folded into the result instead of
  // short-circuiting.
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

export function authenticate(username: string, password: string): DashboardUser | null {
  const users = parseUsers();
  const candidate = username.trim().toLowerCase();

  // Every account is checked even after a match so the response time does not
  // leak whether the username exists.
  let matched: StoredUser | null = null;
  for (const user of users) {
    const usernameOk = timingSafeEqual(user.username.toLowerCase(), candidate);
    const passwordOk = timingSafeEqual(user.password, password);
    if (usernameOk && passwordOk) matched = user;
  }

  return matched ? { username: matched.username, name: matched.name } : null;
}

export function findUser(username: string): DashboardUser | null {
  const user = parseUsers().find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  return user ? { username: user.username, name: user.name } : null;
}
