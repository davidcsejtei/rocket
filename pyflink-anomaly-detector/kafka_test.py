#!/usr/bin/env python3

import json
import os
from kafka import KafkaProducer, KafkaConsumer, KafkaAdminClient
from kafka.admin import NewTopic

def test_kafka_connection():
    kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'host.docker.internal:9092')
    input_topic = 'rocket-telemetry'
    
    print("🔍 Testing Kafka Connection")
    print(f"📊 Kafka Servers: {kafka_servers}")
    print(f"📥 Topic: {input_topic}")
    print("=" * 60)
    
    # Test admin connection
    try:
        admin = KafkaAdminClient(bootstrap_servers=kafka_servers)
        topics = admin.list_topics()
        print(f"✅ Admin connection successful")
        print(f"📋 Available topics: {list(topics)}")
        
        if input_topic in topics:
            print(f"✅ Topic '{input_topic}' exists")
        else:
            print(f"❌ Topic '{input_topic}' does not exist")
            print("🛠️  Creating topic...")
            topic_config = NewTopic(name=input_topic, num_partitions=1, replication_factor=1)
            admin.create_topics([topic_config])
            print(f"✅ Topic '{input_topic}' created")
        
        admin.close()
    except Exception as e:
        print(f"❌ Admin connection failed: {e}")
        return False
    
    # Test producer
    try:
        producer = KafkaProducer(
            bootstrap_servers=kafka_servers,
            value_serializer=lambda x: x.encode('utf-8')
        )
        
        test_message = json.dumps({
            "timestamp": "2025-08-10T22:15:00.000Z",
            "rocketId": "Test-Rocket-001",
            "missionTime": 100.0,
            "stage": 1,
            "status": "ascent",
            "altitude": 20000.0,
            "velocity": 2500.0,
            "acceleration": 25.0,
            "machNumber": 7.5,
            "pitch": 75.0,
            "yaw": 0.5,
            "roll": -0.2,
            "fuelRemaining": 65.0,
            "fuelMass": 250000,
            "thrust": 0,  # This should trigger an anomaly
            "burnRate": 2700.0,  # This should trigger an anomaly
            "engineEfficiency": 45.0,  # This should trigger an anomaly
            "engineTemp": 3600,  # This should trigger an anomaly
            "airDensity": 0.2,
            "dragForce": 60000,
            "totalMass": 300000,
            "thrustToWeight": 0.0,
            "apogee": 250000,
            "sensorNoise": 2.5,  # This should trigger an anomaly
            "guidanceError": 4.0,  # This should trigger an anomaly
            "fuelLeakRate": 150.0,  # This should trigger an anomaly
            "activeAnomalies": 5
        })
        
        print("📤 Sending test telemetry message...")
        future = producer.send(input_topic, test_message)
        future.get(timeout=10)
        print("✅ Test message sent successfully")
        producer.close()
        
    except Exception as e:
        print(f"❌ Producer test failed: {e}")
        return False
    
    # Test consumer
    try:
        consumer = KafkaConsumer(
            input_topic,
            bootstrap_servers=kafka_servers,
            group_id='test-consumer',
            auto_offset_reset='earliest',
            consumer_timeout_ms=10000
        )
        
        print("📥 Testing consumer (10 second timeout)...")
        message_count = 0
        for message in consumer:
            message_count += 1
            print(f"📨 Received message #{message_count}")
            try:
                data = json.loads(message.value.decode('utf-8'))
                print(f"   🚀 Rocket ID: {data.get('rocketId', 'unknown')}")
                print(f"   ⏰ Mission Time: {data.get('missionTime', 0)}s")
                print(f"   📍 Status: {data.get('status', 'unknown')}")
            except Exception as e:
                print(f"   ❌ Error parsing message: {e}")
                print(f"   📄 Raw message: {message.value[:100]}...")
            
            if message_count >= 5:  # Limit to 5 messages
                break
        
        if message_count == 0:
            print("📭 No messages found in topic")
        else:
            print(f"✅ Consumer test successful - received {message_count} message(s)")
        
        consumer.close()
        
    except Exception as e:
        print(f"❌ Consumer test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_kafka_connection()