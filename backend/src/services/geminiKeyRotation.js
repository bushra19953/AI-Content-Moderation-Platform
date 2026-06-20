/**
 * Smart Gemini API Key Rotation Service
 *
 * Loads all configured GEMINI_API_KEY_* env vars into a pool.
 * On each call to `getClient()`, it returns the next available key (round-robin).
 * If a key fails with a quota/rate-limit error (429), it marks it as exhausted
 * for a cooldown period and automatically retries with the next key.
 * If ALL keys are exhausted, it waits for the one with the soonest cooldown expiry.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown when a key hits quota

// Build the key pool from all GEMINI_API_KEY_* env vars
const buildKeyPool = () => {
    const keys = [];
    let i = 1;
    while (process.env[`GEMINI_API_KEY_${i}`]) {
        keys.push({
            key: process.env[`GEMINI_API_KEY_${i}`],
            index: i,
            exhaustedUntil: 0, // timestamp in ms, 0 = available
            totalUses: 0,
            totalErrors: 0,
        });
        i++;
    }
    // Also check for a single GEMINI_API_KEY for backward compat
    if (keys.length === 0 && process.env.GEMINI_API_KEY) {
        keys.push({ key: process.env.GEMINI_API_KEY, index: 0, exhaustedUntil: 0, totalUses: 0, totalErrors: 0 });
    }
    if (keys.length === 0) {
        throw new Error('No Gemini API keys configured. Set GEMINI_API_KEY_1, GEMINI_API_KEY_2, ... in your .env file.');
    }
    console.log(`[KeyRotation] Loaded ${keys.length} API key(s) into rotation pool.`);
    return keys;
};

let keyPool = null;
let currentIndex = 0;

const getPool = () => {
    if (!keyPool) keyPool = buildKeyPool();
    return keyPool;
};

const isQuotaError = (err) => {
    const msg = (err?.message || '').toLowerCase();
    const status = err?.status || err?.httpStatusCode || (err?.response?.status);
    console.error(`[Gemini Error Debug] Status: ${status}, Message: ${err?.message}`);
    return status === 429 || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted');
};

/**
 * Executes `fn(genAIClient)` with automatic key rotation on quota errors.
 * @param {Function} fn - async function receiving a GoogleGenerativeAI instance
 * @returns {Promise<*>} result of fn
 */
const withRotation = async (fn) => {
    const pool = getPool();
    const now = Date.now();
    const totalKeys = pool.length;

    // Find the first available (non-exhausted) key starting from currentIndex
    let attempts = 0;
    while (attempts < totalKeys) {
        const idx = (currentIndex + attempts) % totalKeys;
        const entry = pool[idx];

        if (entry.exhaustedUntil > now) {
            attempts++;
            continue; // This key is cooling down, try next
        }

        try {
            const client = new GoogleGenerativeAI(entry.key);
            const result = await fn(client);
            // Success — advance to next key for round-robin fairness
            entry.totalUses++;
            currentIndex = (idx + 1) % totalKeys;
            return result;
        } catch (err) {
            if (isQuotaError(err)) {
                entry.exhaustedUntil = Date.now() + COOLDOWN_MS;
                entry.totalErrors++;
                console.warn(`[KeyRotation] Key #${entry.index} hit quota. Cooling down for ${COOLDOWN_MS / 1000}s. Trying next key...`);
                attempts++;
                continue;
            }
            // Non-quota error — re-throw immediately
            throw err;
        }
    }

    // All keys exhausted — find which one recovers soonest and wait
    const soonest = pool.reduce((a, b) => (a.exhaustedUntil < b.exhaustedUntil ? a : b));
    const waitMs = soonest.exhaustedUntil - Date.now();
    if (waitMs > 0) {
        console.warn(`[KeyRotation] All keys exhausted. Waiting ${Math.ceil(waitMs / 1000)}s for key #${soonest.index} to recover...`);
        await new Promise(res => setTimeout(res, waitMs + 100));
        soonest.exhaustedUntil = 0;
        return withRotation(fn); // Retry after cooldown
    }

    throw new Error('All Gemini API keys are exhausted and could not recover.');
};

/**
 * Returns a status report of all keys in the pool (for admin/debug use).
 */
const getPoolStatus = () => {
    const pool = getPool();
    const now = Date.now();
    return pool.map(e => ({
        keyIndex: e.index,
        available: e.exhaustedUntil <= now,
        cooldownRemainingMs: Math.max(0, e.exhaustedUntil - now),
        totalUses: e.totalUses,
        totalErrors: e.totalErrors,
    }));
};

module.exports = { withRotation, getPoolStatus };
