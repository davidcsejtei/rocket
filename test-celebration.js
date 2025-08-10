#!/usr/bin/env node

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'celebration-test',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const sendTestTelemetry = async () => {
  await producer.connect();
  console.log('🚀 Connected to Kafka - Starting celebration test...');

  // Send normal telemetry data first
  const normalData = {
    timestamp: new Date().toISOString(),
    rocketId: 'Test-Rocket-001',
    missionTime: 300.0,
    stage: 2,
    status: 'ascent',
    altitude: 95000.0, // Below target
    velocity: 3500.0,
    acceleration: 15.0,
    machNumber: 10.5,
    pitch: 85.0,
    yaw: 0.2,
    roll: -0.1,
    fuelRemaining: 45.0,
    fuelMass: 150000,
    thrust: 5000000,
    burnRate: 2200.0,
    engineEfficiency: 96.0,
    engineTemp: 3100,
    airDensity: 0.1,
    dragForce: 25000,
    totalMass: 200000,
    thrustToWeight: 2.5,
    apogee: 120000,
    sensorNoise: 0.3,
    guidanceError: 0.1,
    fuelLeakRate: 0.0,
    activeAnomalies: 0
  };

  console.log('📡 Sending normal telemetry data (altitude: 95,000m)...');
  await producer.send({
    topic: 'rocket-telemetry',
    messages: [{ value: JSON.stringify(normalData) }]
  });

  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Send telemetry data that reaches the target altitude
  const celebrationData = {
    ...normalData,
    missionTime: 350.0,
    altitude: 101445.0, // Target altitude reached!
    velocity: 4200.0,
    stage: 3,
    status: 'coasting'
  };

  console.log('🎉 Sending celebration telemetry data (altitude: 101,445m)...');
  console.log('This should trigger the celebration popup!');
  
  await producer.send({
    topic: 'rocket-telemetry',
    messages: [{ value: JSON.stringify(celebrationData) }]
  });

  // Send a few more messages above target to verify single celebration
  for (let i = 1; i <= 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const followUpData = {
      ...celebrationData,
      missionTime: 350.0 + (i * 10),
      altitude: 101445.0 + (i * 1000),
      velocity: 4200.0 + (i * 100)
    };

    console.log(`📡 Sending follow-up data ${i} (altitude: ${followUpData.altitude.toLocaleString()}m)...`);
    
    await producer.send({
      topic: 'rocket-telemetry',
      messages: [{ value: JSON.stringify(followUpData) }]
    });
  }

  console.log('✅ Test complete! Check the UI for celebration popup.');
  console.log('Note: Only one celebration should have appeared.');
  
  await producer.disconnect();
  process.exit(0);
};

const main = async () => {
  try {
    await sendTestTelemetry();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

main();