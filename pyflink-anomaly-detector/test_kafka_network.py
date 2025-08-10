#!/usr/bin/env python3

import os
import socket
from kafka import KafkaAdminClient, KafkaProducer, KafkaConsumer

def test_network_connectivity():
    kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:29092')
    
    print("🔍 Testing Network Connectivity")
    print(f"📊 Target: {kafka_servers}")
    print("=" * 60)
    
    # Test socket connection
    try:
        host, port = kafka_servers.split(':')
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        result = sock.connect_ex((host, int(port)))
        sock.close()
        
        if result == 0:
            print(f"✅ Socket connection to {kafka_servers} successful")
        else:
            print(f"❌ Socket connection to {kafka_servers} failed (code: {result})")
            return False
    except Exception as e:
        print(f"❌ Socket connection error: {e}")
        return False
    
    # Test Kafka admin connection
    try:
        admin = KafkaAdminClient(
            bootstrap_servers=kafka_servers,
            request_timeout_ms=10000,
            api_version_auto_timeout_ms=5000
        )
        topics = admin.list_topics()
        print(f"✅ Kafka admin connection successful")
        print(f"📋 Available topics: {list(topics)}")
        admin.close()
    except Exception as e:
        print(f"❌ Kafka admin connection failed: {e}")
        return False
    
    # Test producer
    try:
        producer = KafkaProducer(
            bootstrap_servers=kafka_servers,
            value_serializer=lambda x: x.encode('utf-8'),
            request_timeout_ms=10000
        )
        print(f"✅ Kafka producer connection successful")
        producer.close()
    except Exception as e:
        print(f"❌ Kafka producer connection failed: {e}")
        return False
    
    # Test consumer
    try:
        consumer = KafkaConsumer(
            bootstrap_servers=kafka_servers,
            group_id='network-test',
            auto_offset_reset='latest',
            consumer_timeout_ms=5000
        )
        print(f"✅ Kafka consumer connection successful")
        consumer.close()
    except Exception as e:
        print(f"❌ Kafka consumer connection failed: {e}")
        return False
    
    print("🎉 All network connectivity tests passed!")
    return True

if __name__ == "__main__":
    test_network_connectivity()