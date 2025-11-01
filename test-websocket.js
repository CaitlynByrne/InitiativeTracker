const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected! Socket ID:', socket.id);

  // Identify as DM
  socket.emit('identify', { type: 'dm', name: 'Test DM' });

  // Request state
  socket.emit('state:request');

  // Try adding a creature
  socket.emit('creature:add', {
    name: 'Test Goblin',
    initiative: 15,
    type: 'monster'
  }, (response) => {
    console.log('Add creature response:', response);
  });
});

socket.on('state:update', (state) => {
  console.log('State update received:', JSON.stringify(state, null, 2));
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Keep the script running
setTimeout(() => {
  console.log('Test complete, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 5000);