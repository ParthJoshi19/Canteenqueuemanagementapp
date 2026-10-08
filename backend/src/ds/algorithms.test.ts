import assert from 'node:assert/strict';
import test from 'node:test';
import { LamportClock } from './lamportClock.js';
import { VectorClock } from './vectorClock.js';
import { DistributedMutualExclusion } from './mutualExclusion.js';

test('Lamport receive advances beyond both local and remote clocks', () => {
  const clock = new LamportClock('order-service', 4);

  assert.equal(clock.tick('place-order'), 5);
  assert.equal(clock.updateOnReceive(9, 'queue-update'), 10);
  assert.equal(clock.getClock(), 10);
});

test('vector clocks distinguish causal order from concurrency', () => {
  assert.equal(VectorClock.compare({ a: 1 }, { a: 2 }), 'happened-before');
  assert.equal(VectorClock.compare({ a: 1 }, { a: 1 }), 'identical');
  assert.equal(VectorClock.compare({ a: 1, b: 0 }, { a: 0, b: 1 }), 'concurrent');

  const receiver = new VectorClock('queue-service');
  const merged = receiver.updateOnReceive({ 'order-service': 2 }, 'receive-order');
  assert.deepEqual(merged.vector, { 'order-service': 2, 'queue-service': 1, 'kitchen-service': 0 });
});

test('mutex grants one worker at a time and hands off after release', () => {
  const mutex = new DistributedMutualExclusion();

  assert.equal(mutex.requestLock('chef-a', 42, 1).granted, true);
  assert.equal(mutex.requestLock('chef-b', 42, 2).granted, false);
  assert.deepEqual(mutex.releaseLock('chef-a', 42), { released: true, nextGrantedWorker: 'chef-b' });
  assert.equal(mutex.getActiveLocks()[0]?.workerId, 'chef-b');
});
