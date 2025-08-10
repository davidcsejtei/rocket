#!/usr/bin/env node

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'reset-test',
  brokers: ['localhost:9092']
});

const testResetFunctionality = async () => {
  const producer = kafka.producer();
  await producer.connect();
  console.log('🚀 Connected to Kafka - Testing reset functionality...');

  // 1. Send some test telemetry data
  console.log('\n📡 Step 1: Sending test telemetry data...');
  
  for (let i = 1; i <= 5; i++) {
    const telemetryData = {
      timestamp: new Date().toISOString(),
      rocketId: `Test-Rocket-${i.toString().padStart(3, '0')}`,
      missionTime: i * 50.0,
      stage: 1,
      status: 'ascent',
      altitude: 50000 + (i * 10000),
      velocity: 2000 + (i * 200),
      acceleration: 15.0,
      machNumber: 6.0 + i,
      pitch: 75.0,
      yaw: 0.1,
      roll: -0.1,
      fuelRemaining: 80.0 - (i * 5),
      fuelMass: 300000 - (i * 20000),
      thrust: 6000000,
      burnRate: 2400.0,
      engineEfficiency: 95.0,
      engineTemp: 3000 + (i * 50),
      airDensity: 0.3,
      dragForce: 40000,
      totalMass: 350000 - (i * 20000),
      thrustToWeight: 2.2,
      apogee: 150000 + (i * 10000),
      sensorNoise: 0.2,
      guidanceError: 0.1,
      fuelLeakRate: 0.0,
      activeAnomalies: 0
    };

    await producer.send({
      topic: 'rocket-telemetry',
      messages: [{ value: JSON.stringify(telemetryData) }]
    });

    console.log(`   ✅ Sent telemetry for ${telemetryData.rocketId} (altitude: ${telemetryData.altitude.toLocaleString()}m)`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 2. Send some anomaly data
  console.log('\n🚨 Step 2: Sending test anomaly data...');
  
  for (let i = 1; i <= 3; i++) {
    const anomalyData = {
      alertId: `alert-${Date.now()}-${i}`,
      timestamp: new Date().toISOString(),
      rocketId: `Test-Rocket-${i.toString().padStart(3, '0')}`,
      missionTime: 100.0 + (i * 10),
      anomalyType: ['engine_underperformance', 'fuel_leak', 'thermal_anomaly'][i - 1],
      severity: ['medium', 'high', 'critical'][i - 1],
      affectedParameter: ['engineEfficiency', 'fuelLeakRate', 'engineTemp'][i - 1],
      currentValue: [65.0, 75.0, 3600][i - 1],
      expectedRange: ['outside 40.0-80.0', '< 50.0', '< 3400'][i - 1],
      description: `Test anomaly ${i}`,
      originalTelemetry: {},
      totalAnomalies: i
    };

    await producer.send({
      topic: 'rocket-anomalies',
      messages: [{ value: JSON.stringify(anomalyData) }]
    });

    console.log(`   ✅ Sent ${anomalyData.severity} anomaly: ${anomalyData.anomalyType}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Step 3: Data population complete!');
  console.log('   ✅ 5 telemetry messages sent to rocket-telemetry topic');
  console.log('   ✅ 3 anomaly alerts sent to rocket-anomalies topic');
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Check the UI to see the data is displayed');
  console.log('   2. Use the "Reset Telemetry Data" button to clear telemetry');
  console.log('   3. Use the "Reset Anomalies" button to clear anomalies');
  console.log('   4. Verify that the UI shows empty state after reset');
  console.log('   5. Check that new data appears after reset');

  // 3. Test the API endpoints directly
  console.log('\n🔧 Step 4: Testing API endpoints directly...');
  
  try {
    // Test admin status endpoint
    const statusResponse = await fetch('http://localhost:3000/api/admin/status');
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('   ✅ Admin status endpoint working');
      console.log(`   📊 Telemetry count: ${status.telemetryCount}`);
      console.log(`   📊 Anomaly count: ${status.anomalyCount}`);
      console.log(`   📊 Topics status:`, status.topics);
    } else {
      console.log('   ❌ Admin status endpoint failed');
    }
  } catch (error) {
    console.log(`   ⚠️  Could not test API endpoints: ${error.message}`);
    console.log('   💡 Make sure the backend server is running on localhost:3000');
  }

  await producer.disconnect();
  console.log('\n✅ Test complete! Check the UI to test the reset functionality.');
};

const main = async () => {
  try {
    await testResetFunctionality();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

main();