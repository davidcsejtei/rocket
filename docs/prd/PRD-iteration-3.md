# Product Requirements Document - Iteration 3

## Overview
This document outlines the requirements for the third iteration of the Rocket application, focusing on integrating Apache Kafka for real-time rocket telemetry data consumption and displaying both Kafka connection status and incoming telemetry messages in the UI.

## Objectives
- Establish real-time data streaming architecture using Apache Kafka
- Consume rocket telemetry data from a dedicated Kafka topic
- Provide visual feedback about Kafka connection and data flow status
- Display live telemetry data in an organized, readable format
- Maintain existing WebSocket connection for UI-API communication

## Feature: Kafka Integration with Telemetry Display

### Description
Connect the NestJS backend to a Kafka broker to consume rocket telemetry data from the "rocket-telemetry" topic, and display both Kafka connection status and incoming telemetry messages in a dedicated information box in the UI.

### Acceptance Criteria

1. **Backend Kafka Integration**
   - Kafka client configured to connect to Kafka broker
   - Consumer subscribed to "rocket-telemetry" topic
   - Kafka connection state management (connecting, connected, disconnected, error)
   - Message processing and validation for telemetry data
   - Error handling and retry logic for Kafka operations
   - Telemetry data forwarded to frontend via WebSocket

2. **Telemetry Data Structure**
   ```typescript
   interface TelemetryMessage {
     // Core identification and timing
     timestamp: string;
     rocketId: string;
     missionTime: number;
     stage: number;
     status: 'prelaunch' | 'ascent' | 'coasting' | 'descent' | 'landed' | 'abort';

     // Flight dynamics
     altitude: number;
     velocity: number;
     acceleration: number;
     machNumber: number;

     // Orientation
     pitch: number;
     yaw: number;
     roll: number;

     // Propulsion system
     fuelRemaining: number;
     fuelMass: number;
     thrust: number;
     burnRate: number;
     engineEfficiency: number;

     // Environmental and forces
     engineTemp: number;
     airDensity: number;
     dragForce: number;

     // Calculated metrics
     totalMass: number;
     thrustToWeight: number;
     apogee: number;

     // System health and anomalies
     sensorNoise: number;
     guidanceError: number;
     fuelLeakRate: number;
   }
   ```

3. **Frontend Telemetry Display**
   - Information box positioned alongside connection status panel
   - Real-time display of Kafka connection status with visual indicators
   - Live telemetry message list with newest messages at the top
   - Message limit (show last 10-15 messages) with smooth scrolling
   - Clear visual distinction between different message types/status

4. **Kafka Connection Status Indicators**
   - **Connecting**: Yellow indicator with "Connecting to Kafka..." message
   - **Connected**: Green indicator with "Kafka Connected" message
   - **Disconnected**: Red indicator with "Kafka Disconnected" message  
   - **Error**: Red indicator with "Kafka Error" and error details

5. **Telemetry Message Display**
   - Comprehensive message cards displaying enhanced telemetry data organized in logical groups:
     - **Flight Status**: Mission time, stage, status, altitude, velocity
     - **Propulsion**: Fuel remaining, thrust, engine efficiency, burn rate
     - **Orientation**: Pitch, yaw, roll angles
     - **Performance**: Mach number, thrust-to-weight ratio, apogee
     - **Health**: Sensor noise, guidance error, fuel leak rate
   - Color-coded status indicators based on rocket status (prelaunch, ascent, coasting, descent, landed, abort)
   - Expandable/collapsible sections for detailed vs. summary view
   - Timestamp and mission time display in readable format
   - Auto-scroll to newest messages with smooth animations
   - Empty state when no messages received

6. **Technical Requirements**
   - Service-based architecture for Kafka management
   - TypeScript interfaces for telemetry data
   - Environment configuration for Kafka broker settings
   - Proper error handling and logging
   - Memory management for message history
   - WebSocket integration to forward Kafka data to UI

### Success Metrics
- Kafka connection establishes within 5 seconds under normal conditions
- Messages processed and displayed within 500ms of receipt
- UI remains responsive during high message throughput
- Zero memory leaks from message handling
- Graceful degradation when Kafka is unavailable

### Non-Goals
- Kafka message production (sending data to topics)
- Complex telemetry data analytics or processing
- Historical data persistence beyond session memory
- Multiple topic subscriptions
- Kafka cluster management or administration

## Technical Specifications

### Backend Architecture
```
Kafka Service
├── Connection management
├── Consumer configuration
├── Message processing
└── WebSocket integration

Kafka Module
├── KafkaService
├── TelemetryProcessor
└── Configuration
```

### Frontend Architecture
```
Telemetry Components
├── KafkaStatus component
├── TelemetryMessages component
└── TelemetryMessage card component

Services
├── WebSocket service updates
└── Telemetry data management
```

### Kafka Configuration
- **Topic**: "rocket-telemetry"
- **Consumer Group**: "rocket-api-consumers"
- **Auto Offset Reset**: "latest"
- **Session Timeout**: 30 seconds
- **Message Processing**: JSON deserialization

### WebSocket Events (Addition to Iteration 2)
- `kafka-status`: Kafka connection status updates
- `telemetry-data`: New telemetry message received
- `kafka-error`: Kafka connection or processing errors

### Environment Configuration
- Backend: `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`, `KAFKA_CONSUMER_GROUP`
- Frontend: No additional environment variables needed

### Data Flow
1. Kafka broker receives telemetry messages on "rocket-telemetry" topic
2. NestJS Kafka consumer processes messages
3. Processed data sent to frontend via WebSocket
4. Frontend displays Kafka status and telemetry messages in real-time
5. UI maintains message history (limited buffer)

## Implementation Priority
**High Priority** - Establishes core data streaming capability and real-time telemetry monitoring.

## Dependencies
- Apache Kafka broker (external service)
- KafkaJS or @nestjs/microservices Kafka transport
- Existing WebSocket infrastructure (from Iteration 2)
- Vue 3 reactivity system for real-time updates

## Timeline
- Kafka service integration: 2 days
- Backend message processing: 1 day
- Frontend telemetry components: 2 days
- Integration and testing: 1 day
- Total estimated effort: 6 days

## Risks and Mitigations
- **Kafka broker availability**: Implement proper connection retry and error handling
- **High message throughput**: Use message buffering and UI virtualization if needed
- **Memory usage**: Implement message history limits and cleanup
- **Network latency**: Optimize message serialization and WebSocket transmission

## Testing Requirements
- Unit tests for Kafka service and message processing
- Integration tests for WebSocket data flow
- UI tests for telemetry display and status indicators
- Performance tests for high-volume message scenarios

## Future Considerations
- This enables future features like telemetry analytics, alerts, and historical data visualization
- Foundation for multiple topic subscriptions and advanced streaming features
- Potential integration with monitoring and alerting systems