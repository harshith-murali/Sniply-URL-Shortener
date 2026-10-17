import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const { connect, connection } = vi.hoisted(() => ({
  connect: vi.fn(),
  connection: { readyState: 1 },
}));

vi.mock('mongoose', () => ({ default: { connect, connection } }));

beforeEach(() => {
  vi.resetModules();
  connect.mockReset();
  connection.readyState = 1;
  delete global._mongoose;
  vi.stubEnv('MONGODB_URI', 'mongodb://localhost/test');
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete global._mongoose;
});

describe('connectDB', () => {
  it('retries after an initial DNS failure instead of caching the rejection', async () => {
    const database = { connection };
    connect.mockRejectedValueOnce(Object.assign(new Error('DNS unavailable'), { code: 'ENOTFOUND' }));
    connect.mockResolvedValueOnce(database);
    const { connectDB } = await import('../dbConfig.js');
    await expect(connectDB()).rejects.toMatchObject({ code: 'DB_UNAVAILABLE' });
    await expect(connectDB()).resolves.toBe(database);
    await expect(connectDB()).resolves.toBe(database);
    expect(connect).toHaveBeenCalledTimes(2);
    expect(connect).toHaveBeenCalledWith('mongodb://localhost/test', {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  });

  it('shares one pending connection between concurrent requests', async () => {
    const database = { connection };
    let resolveConnection;
    connect.mockReturnValue(new Promise(resolve => { resolveConnection = resolve; }));
    const { connectDB } = await import('../dbConfig.js');
    const first = connectDB();
    const second = connectDB();
    expect(connect).toHaveBeenCalledTimes(1);
    resolveConnection(database);
    await expect(first).resolves.toBe(database);
    await expect(second).resolves.toBe(database);
  });

  it('reconnects when the cached connection has closed', async () => {
    const database = { connection };
    connect.mockResolvedValue(database);
    const { connectDB } = await import('../dbConfig.js');
    await connectDB();
    connection.readyState = 0;
    await connectDB();
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it('does not fail at module import when configuration is missing', async () => {
    vi.stubEnv('MONGODB_URI', '');
    const { connectDB } = await import('../dbConfig.js');
    await expect(connectDB()).rejects.toMatchObject({ code: 'DB_UNAVAILABLE' });
    expect(connect).not.toHaveBeenCalled();
  });
});
