# PyFlink Anomaly Detector

Real-time anomaly detection for rocket telemetry data using Apache Flink.

## Prerequisites

### Docker Deployment (Recommended)
- Docker
- Docker Compose
- Apache Kafka (external, running on host)

### Local Development
- Python 3.8+
- Apache Flink 1.18.0
- Apache Kafka
- Java 11+ (required by Flink)

## Docker Deployment

### Quick Start

1. Ensure Kafka is running on the host machine (localhost:9092)

2. Start the Flink cluster and anomaly detection job:
```bash
docker-compose up -d
```

3. View logs:
```bash
# View all services
docker-compose logs -f

# View specific service
docker-compose logs -f pyflink-anomaly-detector
```

4. Access Flink Web UI:
```
http://localhost:8081
```

5. Stop the services:
```bash
docker-compose down
```

### Docker Services

- **flink-jobmanager**: Flink cluster coordinator and web UI (port 8081)
- **flink-taskmanager**: Flink worker node for job execution
- **pyflink-anomaly-detector**: Python container running the anomaly detection job

### Environment Variables

Set in `docker-compose.yml` or `.env` file:
- `KAFKA_BOOTSTRAP_SERVERS`: Kafka broker addresses (default: host.docker.internal:9092)
- `FLINK_JOBMANAGER_ADDRESS`: Flink JobManager address (default: flink-jobmanager:8081)

## Local Development Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

3. Create required Kafka topics:
```bash
# Create output topic for anomalies
kafka-topics --create --topic rocket-anomalies --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

4. Run the job locally:
```bash
python anomaly_detector.py
```

## Anomaly Detection Rules

The system detects the following anomalies:

| Parameter | Anomaly Range | Type |
|-----------|---------------|------|
| engineEfficiency | 40.0-80.0 | Engine Underperformance |
| burnRate | 2550.0-2700.0 | Fuel Leak |
| sensorNoise | 1.5-3.0 | Sensor Malfunction |
| guidanceError | 2.0-8.0 | Guidance Failure |
| fuelLeakRate | 50.0-200.0 | Fuel Leak |
| engineTemp | 3400-4000 | Thermal Anomaly |
| thrust | 0 | Engine Shutdown |
| activeAnomalies | 1+ | Multiple Anomalies |

## Output Format

Detected anomalies are published to the `rocket-anomalies` topic in JSON format:

```json
{
  "alertId": "uuid",
  "timestamp": "2025-01-10T14:30:00.000Z",
  "rocketId": "Falcon-9-001",
  "missionTime": 45.2,
  "anomalyType": "thermal_anomaly",
  "severity": "high",
  "affectedParameter": "engineTemp",
  "currentValue": 3750,
  "expectedRange": "outside 3400-4000",
  "description": "engineTemp anomaly: Thermal Anomaly",
  "originalTelemetry": {...},
  "totalAnomalies": 1
}
```