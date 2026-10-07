export type SessionData = {
  isLoggedIn: boolean;
  lastSeen?: number;
  challenge?: string;
};

export const defaultSession: SessionData = {
  isLoggedIn: false,
};
