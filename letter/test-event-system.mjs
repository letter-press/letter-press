/**
 * Test Script for TypeSafe Event System
 * 
 * This script demonstrates the event system functionality
 */

import { TypeSafeEventEmitter, PluginEventSystemImpl, EventHelpers } from '../letter-press-plugin-sdk/dist/hooks/index.js';

async function testEventSystem() {
  console.log('🧪 Testing TypeSafe Event System');
  console.log('================================');

  // Create event emitter
  const eventEmitter = new TypeSafeEventEmitter({
    maxListeners: 50,
    enableTiming: true,
    enableLogging: true
  });

  // Test 1: Basic event emission and listening
  console.log('\n📡 Test 1: Basic Events');
  
  eventEmitter.on('content:created', async (payload) => {
    console.log('✅ Content created listener triggered:', payload.data);
  }, { pluginId: 'test-plugin', priority: 10 });

  await eventEmitter.emit('content:created', {
    id: 'test-1',
    title: 'Test Post',
    type: 'post'
  });

  // Test 2: Plugin-specific events
  console.log('\n🔌 Test 2: Plugin-Specific Events');
  
  const pluginEventSystem = new PluginEventSystemImpl(eventEmitter, 'example-plugin');
  
  pluginEventSystem.onPluginEvent('custom-action', async (payload) => {
    console.log('✅ Plugin custom event received:', payload.data);
  });

  await pluginEventSystem.emitPluginEvent('custom-action', {
    action: 'process-content',
    contentId: 'post-123',
    timestamp: new Date()
  });

  // Test 3: Event priorities
  console.log('\n⚡ Test 3: Event Priorities');
  
  eventEmitter.on('priority:test', async (payload) => {
    console.log('🥈 Medium priority listener:', payload.data);
  }, { priority: 10, pluginId: 'medium' });

  eventEmitter.on('priority:test', async (payload) => {
    console.log('🥇 High priority listener:', payload.data);
  }, { priority: 1, pluginId: 'high' });

  eventEmitter.on('priority:test', async (payload) => {
    console.log('🥉 Low priority listener:', payload.data);
  }, { priority: 20, pluginId: 'low' });

  await eventEmitter.emit('priority:test', { message: 'Priority test' });

  // Test 4: Conditional listeners
  console.log('\n🎯 Test 4: Conditional Listeners');
  
  eventEmitter.on('content:published', async (payload) => {
    console.log('📢 Business hours publish detected:', payload.data);
  }, {
    pluginId: 'business-hours',
    condition: (payload) => {
      const hour = new Date().getHours();
      return hour >= 9 && hour <= 17;
    }
  });

  await eventEmitter.emit('content:published', {
    id: 'test-publish',
    title: 'Test Publication'
  });

  // Test 5: One-time listeners
  console.log('\n🎫 Test 5: One-Time Listeners');
  
  eventEmitter.once('user:login', async (payload) => {
    console.log('👋 Welcome! This will only show once:', payload.data);
  });

  await eventEmitter.emit('user:login', { userId: 'user-1', username: 'testuser' });
  await eventEmitter.emit('user:login', { userId: 'user-2', username: 'testuser2' });

  // Test 6: Error handling
  console.log('\n🚨 Test 6: Error Handling');
  
  eventEmitter.on('error:test', async (payload) => {
    throw new Error('Simulated listener error');
  }, { pluginId: 'error-plugin' });

  eventEmitter.on('error:test', async (payload) => {
    console.log('✅ This listener still works despite the error above');
  }, { pluginId: 'working-plugin' });

  const result = await eventEmitter.emit('error:test', { test: 'error handling' });
  console.log('📊 Emission result:', {
    listeners: result.listenerCount,
    errors: result.errors.length,
    timing: result.executionTime
  });

  // Test 7: Event statistics
  console.log('\n📈 Test 7: Event Statistics');
  
  console.log('Event Stats:', eventEmitter.getEventStats());
  console.log('Listener Counts:', {
    'content:created': eventEmitter.listenerCount('content:created'),
    'priority:test': eventEmitter.listenerCount('priority:test'),
    'user:login': eventEmitter.listenerCount('user:login')
  });

  // Test 8: Helper utilities
  console.log('\n🛠️  Test 8: Helper Utilities');
  
  const safeListener = EventHelpers.createSafeListener(
    async (payload) => {
      console.log('🛡️  Safe listener executed:', payload.data);
    },
    (error) => {
      console.log('🚨 Error caught by safe listener:', error.message);
    }
  );

  eventEmitter.on('safe:test', safeListener, { pluginId: 'safe-test' });
  await eventEmitter.emit('safe:test', { message: 'Testing safe execution' });

  console.log('\n✅ Event System Tests Complete!');
  console.log('================================');
}

// Run the test
testEventSystem().catch(console.error);