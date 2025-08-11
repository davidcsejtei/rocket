import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { AnomalyService } from '../anomaly/anomaly.service';
import { TelemetryMessage, KafkaStatus } from '../types/telemetry.types';
import { AnomalyAlert, AnomalyStatus } from '../types/anomaly.types';

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WebSocketGatewayService implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WebSocketGateway');
  private emergencyMode = false;
  private emergencySimulations = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly anomalyService: AnomalyService
  ) {}

  afterInit(): void {
    this.kafkaService.onTelemetryMessage((message: TelemetryMessage) => {
      // Skip real telemetry during emergency mode
      if (!this.emergencyMode) {
        this.server.emit('telemetry-data', message);
      }
    });

    this.kafkaService.onAnomalyMessage((anomaly: AnomalyAlert) => {
      this.logger.log(`Broadcasting anomaly alert from Kafka: ${anomaly.anomalyType} (${anomaly.severity})`);
      this.server.emit('anomaly-alert', anomaly);
      this.anomalyService.processAnomalyAlert(anomaly);
    });

    this.kafkaService.onStatusChange((status: KafkaStatus) => {
      this.server.emit('kafka-status', status);
    });

    this.anomalyService.onAnomalyAlert((alert: AnomalyAlert) => {
      this.server.emit('anomaly-alert', alert);
    });

    this.anomalyService.onStatusChange((status: AnomalyStatus) => {
      this.server.emit('anomaly-status', status);
    });

    setInterval(() => {
      this.server.emit('kafka-status', this.kafkaService.getStatus());
      this.server.emit('anomaly-status', this.anomalyService.getStatus());
    }, 5000);

    this.logger.log('WebSocket Gateway initialized with Kafka and Anomaly integration');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection-established', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });

    client.emit('kafka-status', this.kafkaService.getStatus());
    client.emit('anomaly-status', this.anomalyService.getStatus());
  }


  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('get-status')
  handleGetStatus(client: Socket): void {
    client.emit('status-update', {
      status: 'connected',
      serverTime: new Date().toISOString(),
      clientId: client.id,
    });
  }

  @SubscribeMessage('get-kafka-status')
  handleGetKafkaStatus(client: Socket): void {
    client.emit('kafka-status', this.kafkaService.getStatus());
  }

  @SubscribeMessage('get-anomaly-status')
  handleGetAnomalyStatus(client: Socket): void {
    client.emit('anomaly-status', this.anomalyService.getStatus());
  }

  @SubscribeMessage('emergency-landing-initiate')
  handleEmergencyLanding(client: Socket): void {
    this.logger.log(`Emergency landing initiated by client: ${client.id}`);
    
    // Set emergency mode
    this.emergencyMode = true;
    
    // Start emergency landing simulation
    this.startEmergencyLandingSimulation(client.id);
    
    // Notify all clients of emergency status
    this.server.emit('emergency-landing-started', {
      timestamp: new Date().toISOString(),
      initiatedBy: client.id
    });
  }

  private startEmergencyLandingSimulation(clientId: string): void {
    // Clear any existing simulation for this client
    if (this.emergencySimulations.has(clientId)) {
      clearInterval(this.emergencySimulations.get(clientId));
    }

    // Starting parameters for emergency landing
    let currentAltitude = 85000; // Start from typical flight altitude
    let currentVelocity = -50; // Initial descent velocity (m/s)
    let simulationTime = 0;
    const startTime = Date.now();

    const simulationInterval = setInterval(() => {
      simulationTime += 1;

      // Emergency landing physics simulation
      const gravity = 9.81;
      let dragCoefficient = 2.5; // Higher drag for emergency systems
      const parachuteAltitude = 5000;
      const parachuteDeployed = currentAltitude < parachuteAltitude;

      // Adjust physics based on altitude
      if (parachuteDeployed) {
        // Parachute deployed - slower descent
        dragCoefficient = 6.0;
        currentVelocity = Math.max(currentVelocity, -15); // Terminal velocity with parachute
      } else {
        // High altitude - faster initial descent
        currentVelocity -= gravity * 0.3; // Gradual acceleration
        currentVelocity = Math.max(currentVelocity, -180); // Max descent rate
      }

      // Update altitude
      currentAltitude += currentVelocity;
      currentAltitude = Math.max(0, currentAltitude);

      // Create simulated telemetry message
      const simulatedMessage: TelemetryMessage = {
        timestamp: new Date().toISOString(),
        rocketId: `EMERGENCY-${clientId.substring(0, 8)}`,
        missionTime: Math.floor((Date.now() - startTime) / 1000),
        stage: 2,
        status: currentAltitude <= 10 ? 'landed' : (currentAltitude < 1000 ? 'descent' : 'abort'),
        
        altitude: Math.round(currentAltitude),
        velocity: Math.round(currentVelocity),
        acceleration: Math.round(gravity + (dragCoefficient * Math.abs(currentVelocity) / 10)),
        machNumber: Math.abs(currentVelocity) / 343, // Approximate Mach number
        
        pitch: Math.random() * 10 - 5, // Small variations
        yaw: Math.random() * 10 - 5,
        roll: Math.random() * 10 - 5,
        
        fuelRemaining: 0, // No fuel during emergency landing
        fuelMass: 0,
        thrust: 0, // No thrust during emergency
        burnRate: 0,
        engineEfficiency: 0,
        
        engineTemp: 300 + Math.random() * 100, // Cooling down
        airDensity: this.calculateAirDensity(currentAltitude),
        dragForce: Math.round(dragCoefficient * Math.abs(currentVelocity)),
        
        totalMass: 5000 + Math.random() * 100, // Approximate empty mass
        thrustToWeight: 0,
        apogee: 85000, // Max altitude reached
        
        sensorNoise: Math.random() * 2, // Increased noise during emergency
        guidanceError: Math.random() * 5, // Higher error during emergency
        fuelLeakRate: 0
      };

      // Broadcast simulated telemetry
      this.server.emit('telemetry-data', simulatedMessage);

      // Check if landed
      if (currentAltitude <= 0) {
        this.completeEmergencyLanding(clientId);
      }

      // Safety timeout (max 3 minutes)
      if (simulationTime > 180) {
        this.completeEmergencyLanding(clientId);
      }
    }, 1000);

    this.emergencySimulations.set(clientId, simulationInterval);
  }

  private calculateAirDensity(altitude: number): number {
    // Simplified atmospheric density model
    const seaLevelDensity = 1.225; // kg/m³
    const scaleHeight = 8400; // meters
    return seaLevelDensity * Math.exp(-altitude / scaleHeight);
  }

  private completeEmergencyLanding(clientId: string): void {
    // Clear simulation
    if (this.emergencySimulations.has(clientId)) {
      clearInterval(this.emergencySimulations.get(clientId));
      this.emergencySimulations.delete(clientId);
    }

    // Reset emergency mode if no active simulations
    if (this.emergencySimulations.size === 0) {
      this.emergencyMode = false;
    }

    // Notify clients of successful landing
    this.server.emit('emergency-landing-completed', {
      timestamp: new Date().toISOString(),
      clientId: clientId,
      success: true
    });

    this.logger.log(`Emergency landing completed for client: ${clientId}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Clean up any emergency simulations for this client
    if (this.emergencySimulations.has(client.id)) {
      clearInterval(this.emergencySimulations.get(client.id));
      this.emergencySimulations.delete(client.id);
      
      // Reset emergency mode if no active simulations
      if (this.emergencySimulations.size === 0) {
        this.emergencyMode = false;
      }
    }
  }
}