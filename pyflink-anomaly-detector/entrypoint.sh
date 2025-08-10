#!/bin/bash

echo "Starting PyFlink Anomaly Detection Job..."
echo "Kafka Bootstrap Servers: $KAFKA_BOOTSTRAP_SERVERS"

# Wait for Kafka to be available
echo "Waiting for Kafka to be ready..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if python -c "from kafka import KafkaConsumer; KafkaConsumer(bootstrap_servers='$KAFKA_BOOTSTRAP_SERVERS')" 2>/dev/null; then
        echo "Kafka is ready!"
        break
    fi
    echo "Waiting for Kafka... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo "Timeout waiting for Kafka to be ready"
    exit 1
fi

# Wait for required topics to exist
echo "Checking for required Kafka topics..."
python -c "
from kafka.admin import KafkaAdminClient, NewTopic
from kafka import KafkaProducer
import time

admin_client = KafkaAdminClient(bootstrap_servers='$KAFKA_BOOTSTRAP_SERVERS')
producer = KafkaProducer(bootstrap_servers='$KAFKA_BOOTSTRAP_SERVERS')

# Check if topics exist, create if they don't
topics = ['rocket-telemetry', 'rocket-anomalies']
existing_topics = admin_client.list_topics()

for topic in topics:
    if topic not in existing_topics:
        print(f'Creating topic: {topic}')
        topic_config = NewTopic(name=topic, num_partitions=1, replication_factor=1)
        admin_client.create_topics([topic_config])
    else:
        print(f'Topic exists: {topic}')

producer.close()
admin_client.close()
"

# Start the PyFlink job
echo "Starting PyFlink anomaly detection job..."
python anomaly_detector.py