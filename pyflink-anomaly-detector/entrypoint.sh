#!/bin/bash

echo "Starting PyFlink Anomaly Detection Job..."
echo "Kafka Bootstrap Servers: $KAFKA_BOOTSTRAP_SERVERS"

# Wait for Kafka to be available
echo "Waiting for Kafka to be ready..."
timeout=120
counter=0

while [ $counter -lt $timeout ]; do
    if python -c "
import socket
import sys
try:
    host, port = '$KAFKA_BOOTSTRAP_SERVERS'.split(':')
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    result = sock.connect_ex((host, int(port)))
    sock.close()
    if result == 0:
        sys.exit(0)
    else:
        sys.exit(1)
except Exception:
    sys.exit(1)
" 2>/dev/null; then
        echo "Kafka is ready!"
        break
    fi
    echo "Waiting for Kafka... ($counter/$timeout)"
    sleep 3
    counter=$((counter + 3))
done

if [ $counter -ge $timeout ]; then
    echo "Timeout waiting for Kafka to be ready"
    echo "Proceeding anyway - will use fallback mode if needed"
fi

# Wait for required topics to exist (if Kafka is available)
echo "Checking for required Kafka topics..."
python -c "
import sys
try:
    from kafka.admin import KafkaAdminClient, NewTopic
    from kafka import KafkaProducer
    import time

    admin_client = KafkaAdminClient(
        bootstrap_servers='$KAFKA_BOOTSTRAP_SERVERS',
        request_timeout_ms=10000,
        api_version_auto_timeout_ms=5000
    )
    
    # Check if topics exist, create if they don't
    topics = ['rocket-telemetry', 'rocket-anomalies']
    try:
        existing_topics = admin_client.list_topics()
        print(f'Existing topics: {list(existing_topics)}')
        
        topics_to_create = []
        for topic in topics:
            if topic not in existing_topics:
                print(f'Topic {topic} does not exist, will create it')
                topics_to_create.append(NewTopic(name=topic, num_partitions=1, replication_factor=1))
            else:
                print(f'Topic exists: {topic}')
        
        if topics_to_create:
            print(f'Creating topics: {[t.name for t in topics_to_create]}')
            admin_client.create_topics(topics_to_create, validate_only=False)
            print('Topics created successfully')
        
        admin_client.close()
        
    except Exception as e:
        print(f'Error managing topics: {e}')
        admin_client.close()
        
except Exception as e:
    print(f'Kafka not available for topic management: {e}')
    print('Will proceed with PyFlink job - topics will be auto-created if needed')
"

# Set additional environment variables for PyFlink
export PYFLINK_CLIENT_EXECUTABLE=/usr/local/bin/python3
export JAVA_TOOL_OPTIONS="-Djava.awt.headless=true"

# Wait a bit before starting the job to ensure Kafka is fully ready
echo "Waiting 10 seconds for system stabilization..."
sleep 10

# Start the PyFlink job with retry logic
echo "Starting PyFlink anomaly detection job..."

max_retries=3
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    echo "Attempt $((retry_count + 1)) of $max_retries"
    
    if python anomaly_detector.py; then
        echo "PyFlink job completed successfully"
        break
    else
        exit_code=$?
        echo "PyFlink job failed with exit code $exit_code"
        
        if [ $retry_count -lt $((max_retries - 1)) ]; then
            echo "Retrying in 15 seconds..."
            sleep 15
            retry_count=$((retry_count + 1))
        else
            echo "Max retries reached. Exiting."
            exit $exit_code
        fi
    fi
done