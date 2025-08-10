export interface TelemetryMessage {
  timestamp: string;
  rocketId: string;
  missionTime: number;
  stage: number;
  status: 'prelaunch' | 'ascent' | 'coasting' | 'descent' | 'landed' | 'abort';

  altitude: number;
  velocity: number;
  acceleration: number;
  machNumber: number;

  pitch: number;
  yaw: number;
  roll: number;

  fuelRemaining: number;
  fuelMass: number;
  thrust: number;
  burnRate: number;
  engineEfficiency: number;

  engineTemp: number;
  airDensity: number;
  dragForce: number;

  totalMass: number;
  thrustToWeight: number;
  apogee: number;

  sensorNoise: number;
  guidanceError: number;
  fuelLeakRate: number;
  activeAnomalies: number;
}

export type KafkaConnectionState = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface KafkaStatus {
  state: KafkaConnectionState;
  connectedAt?: string;
  disconnectedAt?: string;
  lastError?: string;
  messagesReceived: number;
}