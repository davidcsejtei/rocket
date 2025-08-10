import json
import os
import uuid
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from kafka import KafkaConsumer, KafkaProducer


class AnomalyDetector:
    def __init__(self):
        self.anomaly_rules = {
            'engineEfficiency': {'min': 40.0, 'max': 80.0, 'type': 'engine_underperformance'},
            'burnRate': {'min': 2550.0, 'max': 2700.0, 'type': 'fuel_leak'},
            'sensorNoise': {'min': 1.5, 'max': 3.0, 'type': 'sensor_malfunction'},
            'guidanceError': {'min': 2.0, 'max': 8.0, 'type': 'guidance_failure'},
            'fuelLeakRate': {'min': 50.0, 'max': 200.0, 'type': 'fuel_leak'},
            'engineTemp': {'min': 3400, 'max': 4000, 'type': 'thermal_anomaly'},
            'thrust': {'exact': 0, 'type': 'engine_shutdown'},
            'activeAnomalies': {'min': 1, 'type': 'multiple_anomalies'}
        }
    
    def detect_anomalies(self, telemetry_json: str) -> Optional[str]:
        try:
            telemetry = json.loads(telemetry_json)
            detected_anomalies = self._detect_anomalies(telemetry)
            
            if detected_anomalies:
                return json.dumps(detected_anomalies)
            return None
            
        except Exception as e:
            print(f"Error processing telemetry: {e}")
            return None
    
    def _detect_anomalies(self, telemetry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        anomalies = []
        
        for param, rule in self.anomaly_rules.items():
            if param not in telemetry:
                continue
                
            value = telemetry[param]
            anomaly = self._check_parameter_anomaly(param, value, rule, telemetry)
            
            if anomaly:
                anomalies.append(anomaly)
        
        if anomalies:
            primary_anomaly = anomalies[0]
            return {
                'alertId': str(uuid.uuid4()),
                'timestamp': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                'rocketId': telemetry.get('rocketId', 'unknown'),
                'missionTime': telemetry.get('missionTime', 0),
                'anomalyType': primary_anomaly['type'],
                'severity': self._calculate_severity(primary_anomaly, len(anomalies)),
                'affectedParameter': primary_anomaly['parameter'],
                'currentValue': primary_anomaly['value'],
                'expectedRange': primary_anomaly['expected_range'],
                'description': primary_anomaly['description'],
                'originalTelemetry': telemetry,
                'totalAnomalies': len(anomalies)
            }
        
        return None
    
    def _check_parameter_anomaly(self, param: str, value: float, rule: Dict[str, Any], _telemetry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if 'exact' in rule:
            if value == rule['exact']:
                return {
                    'parameter': param,
                    'value': value,
                    'type': rule['type'],
                    'expected_range': f"!= {rule['exact']}",
                    'description': f"{param} anomaly: {rule['type'].replace('_', ' ').title()}"
                }
        
        elif 'min' in rule:
            if 'max' in rule:
                if rule['min'] <= value <= rule['max']:
                    return {
                        'parameter': param,
                        'value': value,
                        'type': rule['type'],
                        'expected_range': f"outside {rule['min']}-{rule['max']}",
                        'description': f"{param} anomaly: {rule['type'].replace('_', ' ').title()}"
                    }
            else:
                if value >= rule['min']:
                    return {
                        'parameter': param,
                        'value': value,
                        'type': rule['type'],
                        'expected_range': f"< {rule['min']}",
                        'description': f"{param} anomaly: {rule['type'].replace('_', ' ').title()}"
                    }
        
        return None
    
    def _calculate_severity(self, anomaly: Dict[str, Any], total_anomalies: int) -> str:
        anomaly_type = anomaly['type']
        value = anomaly['value']
        
        if anomaly_type == 'engine_shutdown' or total_anomalies >= 3:
            return 'critical'
        
        if (anomaly_type == 'fuel_leak' and value > 150) or \
           (anomaly_type == 'thermal_anomaly' and value > 3700) or \
           (anomaly_type == 'guidance_failure' and value > 5.0):
            return 'high'
        
        if (anomaly_type == 'engine_underperformance' and value < 60) or \
           (anomaly_type in ['fuel_leak', 'sensor_malfunction']):
            return 'medium'
        
        return 'low'


class KafkaAnomalyProcessor:
    def __init__(self, kafka_servers: str, input_topic: str, output_topic: str):
        self.kafka_servers = kafka_servers
        self.input_topic = input_topic
        self.output_topic = output_topic
        self.detector = AnomalyDetector()
        self.consumer = None
        self.producer = None
        self.running = False
        
    def create_consumer(self):
        import time
        # Use timestamp to create unique consumer group to ensure fresh start
        group_id = f'anomaly-detector-{int(time.time())}'
        return KafkaConsumer(
            self.input_topic,
            bootstrap_servers=self.kafka_servers,
            group_id=group_id,
            value_deserializer=lambda x: x.decode('utf-8'),
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            consumer_timeout_ms=5000
        )
    
    def create_producer(self):
        return KafkaProducer(
            bootstrap_servers=self.kafka_servers,
            value_serializer=lambda x: x.encode('utf-8'),
            acks='all',
            retries=3,
            retry_backoff_ms=300
        )
    
    def process_messages(self):
        print(f"🔄 Starting Kafka anomaly processor...")
        print(f"   Input topic: {self.input_topic}")
        print(f"   Output topic: {self.output_topic}")
        print(f"   Kafka servers: {self.kafka_servers}")
        
        try:
            self.consumer = self.create_consumer()
            self.producer = self.create_producer()
            self.running = True
            
            print("✅ Connected to Kafka successfully")
            print(f"🔍 Consumer Configuration:")
            print(f"   📥 Subscribed to topic: {self.input_topic}")
            print(f"   👥 Consumer group: {self.consumer.config['group_id']}")
            print(f"   📍 Auto offset reset: earliest")
            print(f"   ⏱️  Consumer timeout: 5000ms")
            print("🔍 Listening for telemetry messages...")
            
            # Get current topic metadata
            try:
                metadata = self.consumer.topics()
                if self.input_topic in metadata:
                    partitions = len(self.consumer.partitions_for_topic(self.input_topic) or [])
                    print(f"📊 Topic '{self.input_topic}' found with {partitions} partition(s)")
                else:
                    print(f"⚠️  Topic '{self.input_topic}' not found in available topics: {list(metadata)[:5]}...")
            except Exception as e:
                print(f"⚠️  Could not get topic metadata: {e}")
            
            message_count = 0
            anomaly_count = 0
            
            print("🔄 Starting continuous message processing loop...")
            print("⏳ Polling for messages every 5 seconds...")
            last_message_time = time.time()
            poll_count = 0
            
            while self.running:
                try:
                    poll_count += 1
                    print(f"🔍 Poll #{poll_count}: Checking for new messages...")
                    message_batch = self.consumer.poll(timeout_ms=5000)
                    
                    if message_batch:
                        last_message_time = time.time()
                        batch_size = sum(len(messages) for messages in message_batch.values())
                        print(f"📦 Received batch with {batch_size} message(s)")
                        
                        for topic_partition, messages in message_batch.items():
                            print(f"📍 Processing {len(messages)} messages from {topic_partition.topic} partition {topic_partition.partition}")
                            for message in messages:
                                message_count += 1
                                telemetry_data = message.value
                                
                                print(f"\n📡 === TELEMETRY MESSAGE #{message_count} ===")
                                
                                try:
                                    # Parse and display telemetry data
                                    telemetry_json = json.loads(telemetry_data)
                                    print(f"🚀 Rocket ID: {telemetry_json.get('rocketId', 'unknown')}")
                                    print(f"⏰ Mission Time: {telemetry_json.get('missionTime', 0)}s")
                                    print(f"📍 Status: {telemetry_json.get('status', 'unknown')}")
                                    print(f"🏔️  Altitude: {telemetry_json.get('altitude', 0):,.1f}m")
                                    print(f"🚄 Velocity: {telemetry_json.get('velocity', 0):,.1f} m/s")
                                    print(f"🔥 Engine Efficiency: {telemetry_json.get('engineEfficiency', 0)}%")
                                    print(f"🌡️  Engine Temp: {telemetry_json.get('engineTemp', 0)}°C")
                                    print(f"⛽ Fuel Remaining: {telemetry_json.get('fuelRemaining', 0)}%")
                                    print(f"💨 Burn Rate: {telemetry_json.get('burnRate', 0)} kg/s")
                                    print(f"⚠️  Active Anomalies: {telemetry_json.get('activeAnomalies', 0)}")
                                except Exception as e:
                                    print(f"❌ Error parsing telemetry data: {e}")
                                    print(f"Raw data: {telemetry_data[:200]}...")
                                
                                # Detect anomalies
                                print(f"🔍 Running anomaly detection...")
                                anomaly_result = self.detector.detect_anomalies(telemetry_data)
                                
                                if anomaly_result:
                                    anomaly_count += 1
                                    anomaly = json.loads(anomaly_result)
                                    
                                    print(f"\n🚨 === ANOMALY #{anomaly_count} DETECTED ===")
                                    print(f"🆔 Alert ID: {anomaly['alertId']}")
                                    print(f"⏰ Timestamp: {anomaly['timestamp']}")
                                    print(f"🚀 Rocket ID: {anomaly['rocketId']}")
                                    print(f"📊 Mission Time: {anomaly['missionTime']}s")
                                    print(f"🎯 Type: {anomaly['anomalyType']}")
                                    print(f"⚠️  Severity: {anomaly['severity'].upper()}")
                                    print(f"🔧 Affected Parameter: {anomaly['affectedParameter']}")
                                    print(f"📏 Current Value: {anomaly['currentValue']}")
                                    print(f"📐 Expected Range: {anomaly['expectedRange']}")
                                    print(f"📝 Description: {anomaly['description']}")
                                    print(f"📊 Total Anomalies in Message: {anomaly['totalAnomalies']}")
                                    
                                    # Publish anomaly to output topic
                                    print(f"📤 Publishing anomaly to {self.output_topic}...")
                                    try:
                                        future = self.producer.send(self.output_topic, anomaly_result)
                                        future.get(timeout=5)  # Wait for confirmation
                                        print(f"✅ Successfully published anomaly to {self.output_topic}")
                                    except Exception as e:
                                        print(f"❌ Failed to publish anomaly: {e}")
                                else:
                                    print("✅ No anomalies detected - All systems normal")
                                
                                print(f"{'='*60}")
                    else:
                        # No messages received - show waiting status
                        print(f"📭 No messages received on poll #{poll_count}")
                        current_time = time.time()
                        if poll_count % 6 == 0:  # Every 30 seconds (6 polls * 5 seconds)
                            elapsed = int(current_time - last_message_time)
                            print(f"⏳ Still waiting for telemetry messages... ({elapsed}s since startup)")
                            print(f"📊 Consumer Status: Connected to {self.kafka_servers}")
                            print(f"📥 Listening on topic: {self.input_topic}")
                            print(f"🔄 Total polls: {poll_count}, Messages received: {message_count}")
                
                except Exception as e:
                    if "timeout" not in str(e).lower():
                        print(f"⚠️  Error processing messages: {e}")
                        time.sleep(1)
                        
        except Exception as e:
            print(f"❌ Kafka connection failed: {e}")
            return False
        finally:
            if self.consumer:
                self.consumer.close()
            if self.producer:
                self.producer.close()
        
        return True
    
    def stop(self):
        self.running = False


def run_test_mode():
    print("🧪 Running in TEST MODE")
    print("=" * 50)
    
    detector = AnomalyDetector()
    
    test_data = [
        {
            "name": "Normal Operation",
            "data": '{"timestamp":"2025-08-10T14:23:45.123Z","rocketId":"Falcon-9-001","missionTime":45.2,"stage":1,"status":"ascent","altitude":12540.7,"velocity":1847.3,"acceleration":18.45,"machNumber":5.38,"pitch":67.2,"yaw":-1.8,"roll":0.4,"fuelRemaining":78.3,"fuelMass":321630,"thrust":7500000,"burnRate":2500.0,"engineEfficiency":98.0,"engineTemp":3200,"airDensity":0.524391,"dragForce":47892,"totalMass":343830,"thrustToWeight":2.26,"apogee":186420,"sensorNoise":0.5,"guidanceError":0.1,"fuelLeakRate":0.0,"activeAnomalies":0}'
        },
        {
            "name": "Multiple Critical Anomalies",
            "data": '{"timestamp":"2025-08-10T14:23:50.123Z","rocketId":"Falcon-9-001","missionTime":50.2,"stage":1,"status":"ascent","altitude":15000.0,"velocity":2000.0,"acceleration":20.0,"machNumber":6.0,"pitch":70.0,"yaw":0.0,"roll":0.0,"fuelRemaining":75.0,"fuelMass":300000,"thrust":0,"burnRate":2600.0,"engineEfficiency":50.0,"engineTemp":3500,"airDensity":0.4,"dragForce":50000,"totalMass":350000,"thrustToWeight":2.1,"apogee":200000,"sensorNoise":2.0,"guidanceError":3.0,"fuelLeakRate":100.0,"activeAnomalies":3}'
        }
    ]
    
    for i, test_case in enumerate(test_data, 1):
        print(f"\n📋 === TEST CASE {i}: {test_case['name']} ===")
        print("-" * 60)
        
        # Parse and display telemetry data
        try:
            telemetry_json = json.loads(test_case['data'])
            print(f"📊 INPUT TELEMETRY DATA:")
            print(f"   🚀 Rocket ID: {telemetry_json.get('rocketId', 'unknown')}")
            print(f"   ⏰ Mission Time: {telemetry_json.get('missionTime', 0)}s")
            print(f"   📍 Status: {telemetry_json.get('status', 'unknown')}")
            print(f"   🏔️  Altitude: {telemetry_json.get('altitude', 0):,.1f}m")
            print(f"   🚄 Velocity: {telemetry_json.get('velocity', 0):,.1f} m/s")
            print(f"   🔥 Thrust: {telemetry_json.get('thrust', 0):,} N")
            print(f"   ⚡ Engine Efficiency: {telemetry_json.get('engineEfficiency', 0)}%")
            print(f"   🌡️  Engine Temp: {telemetry_json.get('engineTemp', 0)}°C")
            print(f"   ⛽ Fuel Remaining: {telemetry_json.get('fuelRemaining', 0)}%")
            print(f"   💨 Burn Rate: {telemetry_json.get('burnRate', 0)} kg/s")
            print(f"   📡 Sensor Noise: {telemetry_json.get('sensorNoise', 0)}")
            print(f"   🎯 Guidance Error: {telemetry_json.get('guidanceError', 0)}")
            print(f"   💧 Fuel Leak Rate: {telemetry_json.get('fuelLeakRate', 0)} kg/s")
            print(f"   ⚠️  Active Anomalies: {telemetry_json.get('activeAnomalies', 0)}")
            
            print(f"\n🔍 ANOMALY DETECTION ANALYSIS:")
        except Exception as e:
            print(f"❌ Error parsing test data: {e}")
        
        result = detector.detect_anomalies(test_case['data'])
        if result:
            anomaly = json.loads(result)
            print(f"🚨 ANOMALY DETECTED:")
            print(f"   🆔 Alert ID: {anomaly['alertId']}")
            print(f"   🚀 Rocket ID: {anomaly['rocketId']}")
            print(f"   📊 Mission Time: {anomaly['missionTime']}s")
            print(f"   🎯 Type: {anomaly['anomalyType']}")
            print(f"   ⚠️  Severity: {anomaly['severity'].upper()}")
            print(f"   🔧 Affected Parameter: {anomaly['affectedParameter']}")
            print(f"   📏 Current Value: {anomaly['currentValue']}")
            print(f"   📐 Expected Range: {anomaly['expectedRange']}")
            print(f"   📝 Description: {anomaly['description']}")
            print(f"   📊 Total Anomalies: {anomaly['totalAnomalies']}")
        else:
            print("✅ No anomalies detected - All systems normal")
        
        print("=" * 60)
    
    print(f"\n🔄 Test complete. Anomaly detection system is working correctly.")


def main():
    kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    input_topic = 'rocket-telemetry'
    output_topic = 'rocket-anomalies'
    
    print("🚀 Starting Rocket Anomaly Detection System")
    print("=" * 60)
    print(f"📊 CONFIGURATION:")
    print(f"   🔌 Kafka Servers: {kafka_servers}")
    print(f"   📥 Input Topic: {input_topic}")
    print(f"   📤 Output Topic: {output_topic}")
    print(f"   🛡️  Anomaly Rules: {len(AnomalyDetector().anomaly_rules)} types")
    print("=" * 60)
    
    # First run test mode to verify functionality
    run_test_mode()
    
    print(f"\n📡 Attempting to connect to Kafka at {kafka_servers}")
    
    # Try Kafka processing
    processor = KafkaAnomalyProcessor(kafka_servers, input_topic, output_topic)
    
    try:
        success = processor.process_messages()
        if not success:
            print("❌ Kafka processing failed")
    except KeyboardInterrupt:
        print("\n🛑 Received interrupt signal. Stopping...")
        processor.stop()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == '__main__':
    main()