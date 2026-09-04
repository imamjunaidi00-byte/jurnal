'use strict';

/** Tiny in-memory key-value cache dengan TTL */
const store = new Map();

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { store.delete(key); return null; }
  return entry.value;
};

const set = (key, value, ttlMs = 60_000) => {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const del = (key) => store.delete(key);

const flush = () => store.clear();

module.exports = { get, set, del, flush };
