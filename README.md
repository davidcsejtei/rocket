# Rocket Telemetry System

A real-time rocket telemetry monitoring system built with Vue.js frontend, NestJS backend, WebSockets, Apache Kafka for streaming data processing, and Apache Flink (PyFlink) for real-time anomaly detection.

## Features

- 🚀 **Animated Rocket Display**: Interactive SVG rocket with animated flame effects
- 🔗 **Real-time WebSocket Connection**: Live connection status monitoring
- 📡 **Kafka Integration**: Real-time telemetry data streaming from Apache Kafka
- 🔍 **PyFlink Anomaly Detection**: Real-time anomaly detection using Apache Flink for critical system monitoring
- 📊 **Live Telemetry Dashboard**: Display of rocket altitude, velocity, fuel, temperature, and status
- 🚨 **System Alerts**: Real-time anomaly alerts with severity-based visual indicators
- 🌐 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **TypeScript**: Full type safety across frontend and backend

## Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    Kafka     ┌─────────────────┐
│   Vue 3 Frontend│◄──────────────►│  NestJS Backend │◄────────────►│  Apache Kafka   │
│   (rocket-ui)   │                 │   (rocket-api)  │              │                 │
└─────────────────┘                 └─────────────────┘              └─────────────────┘
                                            ▲                                │
                                            │                                │
                                            │ anomalies                      │ telemetry
                                            │                                │
                                            │                                ▼
                                    ┌─────────────────┐              ┌─────────────────┐
                                    │ PyFlink Anomaly │◄─────────────│ Apache Flink    │
                                    │ Detection Job   │              │ Cluster         │
                                    └─────────────────┘              └─────────────────┘
```

## Prerequisites

### Required Software

- **Docker** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)

### Installing Prerequisites

#### Docker & Docker Compose

**All services (Kafka, Flink, Backend API, Frontend UI) run via Docker Compose - no manual installation required.**

- **macOS:** Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt-get update
  sudo apt-get install docker.io docker-compose-plugin
  sudo systemctl start docker
  sudo usermod -aG docker $USER
  ```
- **Windows:** Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)

**Verify installation:**
```bash
docker --version
docker compose version
```

## How to Run Locally

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd rocket

# Copy environment files
cp .env.example .env
```

### 2. Start All Services

**Start the entire system with a single command:**

```bash
# Start all services (Kafka, Flink, Backend API, Frontend UI, Anomaly Detection)
docker compose up -d

# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f rocket-api
docker compose logs -f rocket-ui
docker compose logs -f pyflink-anomaly-detector
```

**Service URLs:**
- **Frontend UI**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`
- **Flink Web UI**: `http://localhost:8081`
- **Kafka**: `localhost:9092` (internal)

### 3. Test the System

#### Send Test Telemetry Data:
```bash
# Use Kafka console producer via Docker
docker compose exec kafka kafka-console-producer --topic rocket-telemetry --bootstrap-server localhost:9092
```

Then paste this JSON message:
```json
{"timestamp":"2025-08-10T14:23:45.123Z","rocketId":"Falcon-9-001","missionTime":45.2,"stage":1,"status":"ascent","altitude":12540.7,"velocity":1847.3,"acceleration":18.45,"machNumber":5.38,"pitch":67.2,"yaw":-1.8,"roll":0.4,"fuelRemaining":78.3,"fuelMass":321630,"thrust":7607000,"burnRate":2500.0,"engineEfficiency":100.0,"engineTemp":3182,"airDensity":0.524391,"dragForce":47892,"totalMass":343830,"thrustToWeight":2.26,"apogee":186420,"sensorNoise":1.0,"guidanceError":0.0,"fuelLeakRate":0.0,"activeAnomalies":0}
```

Press Enter to send the message. You should see it appear in the UI immediately with comprehensive telemetry data.

#### Test Anomaly Detection:

Send a message with anomalous values to trigger alerts:
```json
{"timestamp":"2025-08-10T14:23:45.123Z","rocketId":"Falcon-9-001","missionTime":45.2,"stage":1,"status":"ascent","altitude":12540.7,"velocity":1847.3,"acceleration":18.45,"machNumber":5.38,"pitch":67.2,"yaw":-1.8,"roll":0.4,"fuelRemaining":78.3,"fuelMass":321630,"thrust":0,"burnRate":2600.0,"engineEfficiency":50.0,"engineTemp":3500,"airDensity":0.524391,"dragForce":47892,"totalMass":343830,"thrustToWeight":2.26,"apogee":186420,"sensorNoise":2.0,"guidanceError":3.0,"fuelLeakRate":100.0,"activeAnomalies":3}
```

This message contains multiple anomalies:
- `thrust`: 0 (engine shutdown)
- `burnRate`: 2600.0 (fuel leak)
- `engineEfficiency`: 50.0 (underperformance)
- `engineTemp`: 3500 (thermal anomaly)
- `sensorNoise`: 2.0 (sensor malfunction)
- `guidanceError`: 3.0 (guidance failure)
- `fuelLeakRate`: 100.0 (fuel leak rate)
- `activeAnomalies`: 3 (multiple concurrent issues)

You should see these anomalies appear in the System Alerts panel with appropriate severity levels.

## Environment Variables

### Root (.env)
```bash
# Application Ports
FRONTEND_PORT=5173
BACKEND_PORT=3000
FLINK_WEB_UI_PORT=8081

# Service URLs (Docker internal networking)
FRONTEND_URL=http://rocket-ui:5173
BACKEND_URL=http://rocket-api:3000
KAFKA_BROKERS=kafka:29092
KAFKA_EXTERNAL_PORT=9092

# Kafka Configuration
KAFKA_CLIENT_ID=rocket-api
KAFKA_CONSUMER_GROUP=rocket-api-consumers
KAFKA_ANOMALY_CONSUMER_GROUP=rocket-api-anomaly-consumers

# Flink Configuration
FLINK_JOBMANAGER_ADDRESS=flink-jobmanager:8081

# WebSocket Configuration
VITE_WEBSOCKET_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

**Note**: All services communicate via Docker internal networking. External access is available through mapped ports.

## Project Structure

```
rocket/
├── rocket-api/                    # NestJS Backend
│   ├── src/
│   │   ├── kafka/                 # Kafka service and configuration
│   │   ├── websocket/             # WebSocket gateway
│   │   └── types/                 # TypeScript type definitions
│   └── package.json
├── rocket-ui/                     # Vue.js Frontend
│   ├── src/
│   │   ├── components/            # Vue components
│   │   ├── services/              # WebSocket and business logic
│   │   └── types/                 # TypeScript interfaces
│   └── package.json
├── pyflink-anomaly-detector/      # PyFlink Anomaly Detection
│   ├── docker-compose.yml         # Flink cluster configuration
│   ├── Dockerfile                 # PyFlink job container
│   ├── anomaly_detector.py        # Anomaly detection logic
│   └── .env.example               # Environment configuration
├── docs/prd/                      # Product Requirements Documents
└── README.md
```

## Available Scripts

### Main Docker Compose Commands
- `docker compose up -d` - Start all services in detached mode
- `docker compose up` - Start all services with logs
- `docker compose down` - Stop all services and remove containers
- `docker compose down -v` - Stop all services and remove containers with volumes
- `docker compose restart` - Restart all services
- `docker compose logs -f` - Follow logs for all services
- `docker compose logs -f <service-name>` - Follow logs for specific service

### Individual Service Management
- `docker compose up -d kafka` - Start only Kafka and its dependencies
- `docker compose up -d flink-jobmanager flink-taskmanager` - Start only Flink cluster
- `docker compose restart rocket-api` - Restart backend API
- `docker compose restart rocket-ui` - Restart frontend UI
- `docker compose restart pyflink-anomaly-detector` - Restart anomaly detection

### Development Commands
- `docker compose exec rocket-api npm run test` - Run backend tests
- `docker compose exec rocket-ui npm run test:unit` - Run frontend tests
- `docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092` - List Kafka topics

## Telemetry Data Format

The system expects Kafka messages in the following comprehensive JSON format:

```json
{
  "timestamp": "2025-08-10T14:23:45.123Z",
  "rocketId": "Falcon-9-001",
  "missionTime": 45.2,
  "stage": 1,
  "status": "ascent",

  "altitude": 12540.7,
  "velocity": 1847.3,
  "acceleration": 18.45,
  "machNumber": 5.38,

  "pitch": 67.2,
  "yaw": -1.8,
  "roll": 0.4,

  "fuelRemaining": 78.3,
  "fuelMass": 321630,
  "thrust": 7607000,
  "burnRate": 2500.0,
  "engineEfficiency": 100.0,

  "engineTemp": 3182,
  "airDensity": 0.524391,
  "dragForce": 47892,

  "totalMass": 343830,
  "thrustToWeight": 2.26,
  "apogee": 186420,

  "sensorNoise": 1.0,
  "guidanceError": 0.0,
  "fuelLeakRate": 0.0,
  "activeAnomalies": 0
}
```

### Status Values
- `prelaunch` - Pre-flight preparations
- `ascent` - Powered ascent phase
- `coasting` - Unpowered flight phase
- `descent` - Descent phase
- `landed` - Successfully landed
- `abort` - Mission abort scenario

## Connection Status Indicators

- 🟢 **Green**: Connected and operational
- 🟡 **Yellow**: Connecting/reconnecting
- 🔴 **Red**: Disconnected or error state
- ⚫ **Gray**: Service unavailable

## Troubleshooting

### Common Issues

1. **Services Not Starting**
   ```bash
   # Check if Docker is running
   docker info
   
   # Check service status
   docker compose ps
   
   # View service logs
   docker compose logs <service-name>
   ```

2. **Port Conflicts**
   ```bash
   # Check what's using the ports
   sudo lsof -i :3000  # Backend
   sudo lsof -i :5173  # Frontend
   sudo lsof -i :8081  # Flink Web UI
   sudo lsof -i :9092  # Kafka
   ```

3. **Kafka Connection Issues**
   ```bash
   # Check Kafka container
   docker compose logs kafka
   
   # Verify topics exist
   docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
   ```

4. **Flink Job Issues**
   ```bash
   # Check Flink logs
   docker compose logs flink-jobmanager
   docker compose logs flink-taskmanager
   docker compose logs pyflink-anomaly-detector
   ```

### Logs and Debugging

- **All services**: `docker compose logs -f`
- **Backend API**: `docker compose logs -f rocket-api`
- **Frontend UI**: `docker compose logs -f rocket-ui`
- **Kafka**: `docker compose logs -f kafka`
- **Flink**: `docker compose logs -f flink-jobmanager`
- **Anomaly Detection**: `docker compose logs -f pyflink-anomaly-detector`

### Clean Restart
```bash
# Complete reset
docker compose down -v
docker compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.