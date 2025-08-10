# Rocket Telemetry System

A real-time rocket telemetry monitoring system built with Vue.js frontend, NestJS backend, WebSockets, and Apache Kafka for streaming data processing.

## Features

- 🚀 **Animated Rocket Display**: Interactive SVG rocket with animated flame effects
- 🔗 **Real-time WebSocket Connection**: Live connection status monitoring
- 📡 **Kafka Integration**: Real-time telemetry data streaming from Apache Kafka
- 📊 **Live Telemetry Dashboard**: Display of rocket altitude, velocity, fuel, temperature, and status
- 🌐 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **TypeScript**: Full type safety across frontend and backend

## Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    Kafka     ┌─────────────────┐
│   Vue 3 Frontend│◄──────────────►│  NestJS Backend │◄────────────►│  Apache Kafka   │
│   (rocket-ui)   │                 │   (rocket-api)  │              │                 │
└─────────────────┘                 └─────────────────┘              └─────────────────┘
```

## Prerequisites

### Required Software

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Apache Kafka** (v2.8 or higher)
- **Java** (v11 or higher, for running Kafka)

### Installing Prerequisites

#### 1. Node.js and npm
- Download and install from [nodejs.org](https://nodejs.org/)
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

#### 2. Apache Kafka
- **macOS (using Homebrew):**
  ```bash
  brew install kafka
  ```

- **Linux (Ubuntu/Debian):**
  ```bash
  wget https://downloads.apache.org/kafka/2.8.2/kafka_2.13-2.8.2.tgz
  tar -xzf kafka_2.13-2.8.2.tgz
  cd kafka_2.13-2.8.2
  ```

- **Windows:**
  - Download Kafka from [Apache Kafka Downloads](https://kafka.apache.org/downloads)
  - Extract the archive and add to PATH

#### 3. Java (for Kafka)
- **macOS:** `brew install openjdk@11`
- **Linux:** `sudo apt-get install openjdk-11-jdk`
- **Windows:** Download from [Oracle JDK](https://www.oracle.com/java/technologies/downloads/)

## How to Run Locally

### 1. Start Apache Kafka

#### Start Zookeeper (Terminal 1):
```bash
# macOS/Linux
zookeeper-server-start /usr/local/etc/kafka/zookeeper.properties

# Or if using downloaded Kafka
bin/zookeeper-server-start.sh config/zookeeper.properties
```

#### Start Kafka Server (Terminal 2):
```bash
# macOS/Linux
kafka-server-start /usr/local/etc/kafka/server.properties

# Or if using downloaded Kafka
bin/kafka-server-start.sh config/server.properties
```

#### Create the Required Topic (Terminal 3):
```bash
# Create rocket-telemetry topic
kafka-topics --create --topic rocket-telemetry --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

# Verify topic creation
kafka-topics --list --bootstrap-server localhost:9092
```

### 2. Start the Backend API (Terminal 4)

```bash
# Navigate to backend directory
cd rocket-api

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start the development server
npm run start:dev
```

The backend will start on `http://localhost:3000`

### 3. Start the Frontend UI (Terminal 5)

```bash
# Navigate to frontend directory
cd rocket-ui

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Test the System

#### Send Test Telemetry Data (Terminal 6):
```bash
# Send a test message to Kafka
kafka-console-producer --topic rocket-telemetry --bootstrap-server localhost:9092
```

Then paste this JSON message:
```json
{"timestamp":"2025-01-10T14:30:00.000Z","rocketId":"ROCKET-001","altitude":15000,"velocity":350,"fuel":85,"temperature":25,"status":"flight"}
```

Press Enter to send the message. You should see it appear in the UI immediately.

## Environment Variables

### Backend (.env)
```bash
FRONTEND_URL=http://localhost:5173
PORT=3000
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=rocket-api
KAFKA_CONSUMER_GROUP=rocket-api-consumers
```

### Frontend (.env)
```bash
VITE_WEBSOCKET_URL=http://localhost:3000
```

## Project Structure

```
rocket/
├── rocket-api/          # NestJS Backend
│   ├── src/
│   │   ├── kafka/       # Kafka service and configuration
│   │   ├── websocket/   # WebSocket gateway
│   │   └── types/       # TypeScript type definitions
│   └── package.json
├── rocket-ui/           # Vue.js Frontend
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── services/    # WebSocket and business logic
│   │   └── types/       # TypeScript interfaces
│   └── package.json
├── docs/prd/           # Product Requirements Documents
└── README.md
```

## Available Scripts

### Backend (rocket-api)
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run test` - Run tests

### Frontend (rocket-ui)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test:unit` - Run unit tests

## Telemetry Data Format

The system expects Kafka messages in the following JSON format:

```json
{
  "timestamp": "2025-01-10T14:30:00.000Z",
  "rocketId": "ROCKET-001",
  "altitude": 15000,
  "velocity": 350,
  "fuel": 85,
  "temperature": 25,
  "status": "launching" | "flight" | "landing" | "landed"
}
```

## Connection Status Indicators

- 🟢 **Green**: Connected and operational
- 🟡 **Yellow**: Connecting/reconnecting
- 🔴 **Red**: Disconnected or error state
- ⚫ **Gray**: Service unavailable

## Troubleshooting

### Common Issues

1. **Kafka Connection Failed**
   - Ensure Kafka and Zookeeper are running
   - Verify the topic `rocket-telemetry` exists
   - Check that port 9092 is available

2. **WebSocket Connection Failed**
   - Ensure backend is running on port 3000
   - Check firewall settings
   - Verify CORS configuration

3. **Frontend Not Loading**
   - Ensure all dependencies are installed (`npm install`)
   - Check that port 5173 is available
   - Verify environment variables are set

### Logs and Debugging

- **Backend logs**: Check the terminal running `npm run start:dev`
- **Frontend logs**: Check browser developer console
- **Kafka logs**: Check Kafka server terminal output

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.