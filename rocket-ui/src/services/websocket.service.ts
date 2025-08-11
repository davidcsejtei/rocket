import { ref, reactive, computed } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { ConnectionState, ConnectionStatus, ServerMessage } from '@/types/websocket.types'
import type { TelemetryMessage, KafkaStatus } from '@/types/telemetry.types'
import type { AnomalyAlert, AnomalyStatus } from '@/types/anomaly.types'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectTimer: number | null = null
  private heartbeatInterval: number | null = null

  public connectionStatus = reactive<ConnectionStatus>({
    state: 'disconnected',
    reconnectAttempts: 0,
  })

  public kafkaStatus = reactive<KafkaStatus>({
    state: 'disconnected',
    messagesReceived: 0,
  })

  public telemetryMessages = ref<TelemetryMessage[]>([])
  private readonly maxMessages = 15

  public anomalyStatus = reactive<AnomalyStatus>({
    state: 'disconnected',
    anomaliesReceived: 0,
  })

  public recentAnomalies = ref<AnomalyAlert[]>([])
  public allAnomalies = ref<AnomalyAlert[]>([])
  private readonly maxRecentAnomalies = 10
  private readonly maxAllAnomalies = 50

  // Current rocket status tracking
  public currentRocketStatus = ref<string>('prelaunch')
  public statusHistory = ref<{ status: string; timestamp: Date; rocketId: string }[]>([])
  private readonly maxStatusHistory = 20

  // Emergency landing state
  public emergencyMode = ref(false)
  public emergencyLandingInProgress = ref(false)
  private emergencySimulationInterval: number | null = null
  private isQuickLandingMode = ref(false)

  // Severity-based priority alerts (top 3)
  public priorityAlerts = computed(() => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    
    return [...this.recentAnomalies.value]
      .sort((a, b) => {
        // First sort by severity (highest first)
        const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
        if (severityDiff !== 0) return severityDiff
        
        // If same severity, sort by timestamp (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
      .slice(0, 3)
  })

  // Celebration state management
  public celebrationData = ref<{
    visible: boolean
    finalAltitude: number
    rocketId: string
    missionTime: number
  } | null>(null)

  private readonly targetAltitude = 100000 // 100,000m - Mission success altitude
  private celebratedRockets = new Set<string>()
  private lastProcessedAltitude = new Map<string, number>()

  private readonly maxReconnectAttempts = 20
  private readonly reconnectDelay = 1000
  private readonly heartbeatInterval_ms = 30000

  connect(): void {
    if (this.socket?.connected) {
      return
    }

    this.updateConnectionState('connecting')

    const serverUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000'

    this.socket = io(serverUrl, {
      timeout: 5000,
      reconnection: false,
      transports: ['websocket', 'polling'],
      forceNew: true,
    })

    this.setupEventListeners()
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.updateConnectionState('disconnected')
  }

  private setupEventListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.updateConnectionState('connected')
      this.connectionStatus.connectedAt = new Date()
      this.connectionStatus.reconnectAttempts = 0
      this.startHeartbeat()
      this.requestKafkaStatus()
    })

    this.socket.on('disconnect', (reason: string) => {
      this.updateConnectionState('disconnected')
      this.connectionStatus.disconnectedAt = new Date()
      this.kafkaStatus.state = 'disconnected'
      this.anomalyStatus.state = 'disconnected'

      if (reason === 'io server disconnect') {
        this.connectionStatus.lastError = 'Server disconnected'
      } else {
        this.attemptReconnection()
      }
    })

    this.socket.on('connect_error', (error: Error) => {
      this.updateConnectionState('error')
      this.connectionStatus.lastError = error.message
      this.kafkaStatus.state = 'error'
      this.kafkaStatus.lastError = 'API connection failed'
      this.anomalyStatus.state = 'error'
      this.anomalyStatus.lastError = 'API connection failed'
      this.attemptReconnection()
    })

    this.socket.on('connection-established', (data: ServerMessage) => {
      console.log('Connection established:', data)
    })

    this.socket.on('pong', (data: ServerMessage) => {
      console.log('Heartbeat received:', data)
    })

    this.socket.on('kafka-status', (status: KafkaStatus) => {
      Object.assign(this.kafkaStatus, status)
    })

    this.socket.on('telemetry-data', (message: TelemetryMessage) => {
      this.addTelemetryMessage(message)
    })

    this.socket.on('kafka-error', (error: { message: string }) => {
      this.kafkaStatus.state = 'error'
      this.kafkaStatus.lastError = error.message
    })

    this.socket.on('anomaly-status', (status: AnomalyStatus) => {
      Object.assign(this.anomalyStatus, status)
    })

    this.socket.on('anomaly-alert', (alert: AnomalyAlert) => {
      this.addAnomalyAlert(alert)
    })

    this.socket.on('anomaly-error', (error: { message: string }) => {
      this.anomalyStatus.state = 'error'
      this.anomalyStatus.lastError = error.message
    })

    this.socket.on('emergency-reset-completed', (data: { timestamp: string; resetBy: string }) => {
      console.log('✅ Backend confirmed emergency reset completed:', data)
    })
  }

  private updateConnectionState(state: ConnectionState): void {
    this.connectionStatus.state = state
  }

  private attemptReconnection(): void {
    if (this.connectionStatus.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateConnectionState('error')
      this.connectionStatus.lastError = 'Max reconnection attempts reached'
      return
    }

    if (this.reconnectTimer) {
      return
    }

    this.updateConnectionState('reconnecting')
    this.connectionStatus.reconnectAttempts++

    const delay = this.reconnectDelay * Math.pow(2, this.connectionStatus.reconnectAttempts - 1)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping')
      }
    }, this.heartbeatInterval_ms)
  }

  getUptime(): string {
    if (!this.connectionStatus.connectedAt || this.connectionStatus.state !== 'connected') {
      return '0s'
    }

    const uptimeMs = Date.now() - this.connectionStatus.connectedAt.getTime()
    const seconds = Math.floor(uptimeMs / 1000)

    if (seconds < 60) {
      return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${minutes}m ${remainingSeconds}s`
  }

  private addTelemetryMessage(message: TelemetryMessage): void {
    // Skip processing real telemetry during emergency mode
    if (this.emergencyMode.value) {
      console.log('🛑 Skipping telemetry processing - Emergency mode active')
      return
    }

    // Additional check: skip processing if we're in any emergency landing state
    if (this.emergencyLandingInProgress.value || this.isQuickLandingMode.value) {
      console.log('🛑 Skipping telemetry processing - Emergency landing in progress')
      return
    }

    this.telemetryMessages.value.unshift(message)

    if (this.telemetryMessages.value.length > this.maxMessages) {
      this.telemetryMessages.value = this.telemetryMessages.value.slice(0, this.maxMessages)
    }

    // Update current rocket status
    this.updateRocketStatus(message)

    // Check for celebration trigger
    this.checkForCelebration(message)
  }

  private updateRocketStatus(message: TelemetryMessage): void {
    const newStatus = message.status
    const currentStatus = this.currentRocketStatus.value

    // Only update if status has changed
    if (newStatus !== currentStatus) {
      this.currentRocketStatus.value = newStatus
      
      // Add to status history
      this.statusHistory.value.unshift({
        status: newStatus,
        timestamp: new Date(),
        rocketId: message.rocketId
      })

      // Keep only recent status changes
      if (this.statusHistory.value.length > this.maxStatusHistory) {
        this.statusHistory.value = this.statusHistory.value.slice(0, this.maxStatusHistory)
      }

      console.log(`🚀 Rocket status changed: ${currentStatus} → ${newStatus} (${message.rocketId})`)
    }
  }

  private checkForCelebration(message: TelemetryMessage): void {
    const rocketKey = message.rocketId
    const currentAltitude = message.altitude
    const lastAltitude = this.lastProcessedAltitude.get(rocketKey)

    // Debug logging for altitude tracking
    if (currentAltitude >= 90000) {
      console.log(`🎯 Altitude check: ${rocketKey} at ${currentAltitude.toLocaleString()}m (last: ${lastAltitude?.toLocaleString() || 'none'}m, target: ${this.targetAltitude.toLocaleString()}m, celebrated: ${this.celebratedRockets.has(rocketKey)})`)
    }

    // Check if this rocket has already celebrated
    if (this.celebratedRockets.has(rocketKey)) {
      // Update last processed altitude even if already celebrated
      this.lastProcessedAltitude.set(rocketKey, currentAltitude)
      return
    }

    // Check if we've reached the target altitude
    if (currentAltitude >= this.targetAltitude) {
      // If this is the first time we're seeing this rocket, or if it crossed the threshold
      if (lastAltitude === undefined || lastAltitude < this.targetAltitude) {
        console.log(`🚀 Triggering celebration for ${rocketKey} at ${currentAltitude.toLocaleString()}m!`)
        this.triggerCelebration(message)
      } else {
        console.log(`⚠️ Rocket ${rocketKey} above target but not triggering celebration: lastAlt=${lastAltitude?.toLocaleString()}m, currentAlt=${currentAltitude.toLocaleString()}m`)
      }
    }

    // Update last processed altitude
    this.lastProcessedAltitude.set(rocketKey, currentAltitude)
  }

  private triggerCelebration(message: TelemetryMessage): void {
    // Mark this rocket as celebrated
    this.celebratedRockets.add(message.rocketId)

    // Show celebration popup
    this.celebrationData.value = {
      visible: true,
      finalAltitude: message.altitude,
      rocketId: message.rocketId,
      missionTime: message.missionTime,
    }

    console.log(
      `🎉 Mission Success! Rocket ${message.rocketId} reached ${message.altitude.toLocaleString()}m (100km altitude milestone) at mission time ${message.missionTime}s`,
    )
  }

  public dismissCelebration(): void {
    if (this.celebrationData.value) {
      this.celebrationData.value.visible = false
      // Clear celebration data after animation completes
      setTimeout(() => {
        this.celebrationData.value = null
      }, 500)
    }
  }

  public resetCelebrationState(): void {
    this.celebratedRockets.clear()
    this.lastProcessedAltitude.clear()
    this.celebrationData.value = null
  }

  public testCelebration(): void {
    const testMessage: TelemetryMessage = {
      timestamp: new Date().toISOString(),
      rocketId: 'Test-Rocket-' + Date.now(),
      missionTime: 300,
      stage: 2,
      status: 'ascent',
      altitude: 105000,
      velocity: 3500,
      acceleration: 15,
      machNumber: 10.5,
      pitch: 85,
      yaw: 0.2,
      roll: -0.1,
      fuelRemaining: 45,
      fuelMass: 150000,
      thrust: 5000000,
      burnRate: 2200,
      engineEfficiency: 96,
      engineTemp: 3100,
      airDensity: 0.1,
      dragForce: 25000,
      totalMass: 200000,
      thrustToWeight: 2.5,
      apogee: 120000,
      sensorNoise: 0.3,
      guidanceError: 0.1,
      fuelLeakRate: 0
    }
    
    console.log('🧪 Testing celebration with test message')
    this.triggerCelebration(testMessage)
  }

  public forceClearAnomalies(): void {
    console.log(`🔥 Force clearing anomalies - Before: recent=${this.recentAnomalies.value.length}, all=${this.allAnomalies.value.length}`)
    this.recentAnomalies.value.splice(0)
    this.allAnomalies.value.splice(0)
    console.log(`🔥 Force clear completed - After: recent=${this.recentAnomalies.value.length}, all=${this.allAnomalies.value.length}`)
  }

  public resetTelemetryData(): void {
    // Clear telemetry messages
    this.telemetryMessages.value = []

    // Reset Kafka status message count
    this.kafkaStatus.messagesReceived = 0

    // Reset rocket status
    this.currentRocketStatus.value = 'prelaunch'
    this.statusHistory.value = []

    // Reset celebration state (allow new celebrations)
    this.resetCelebrationState()

    console.log('Telemetry data reset completed')
  }

  public resetAnomalyData(): void {
    // Clear anomaly alerts
    console.log(`🧹 Resetting anomaly data - Before: recent=${this.recentAnomalies.value.length}, all=${this.allAnomalies.value.length}`)
    
    // Use splice to ensure reactivity
    this.recentAnomalies.value.splice(0, this.recentAnomalies.value.length)
    this.allAnomalies.value.splice(0, this.allAnomalies.value.length)

    // Reset anomaly status
    this.anomalyStatus.anomaliesReceived = 0

    console.log(`🧹 Anomaly data reset completed - After: recent=${this.recentAnomalies.value.length}, all=${this.allAnomalies.value.length}`)
  }

  public resetAllData(): void {
    this.resetTelemetryData()
    this.resetAnomalyData()
    console.log('All data reset completed')
  }

  requestKafkaStatus(): void {
    if (this.socket?.connected) {
      this.socket.emit('get-kafka-status')
    }
  }

  private addAnomalyAlert(alert: AnomalyAlert): void {
    // Add to recent anomalies (newest first)
    this.recentAnomalies.value.unshift(alert)
    if (this.recentAnomalies.value.length > this.maxRecentAnomalies) {
      this.recentAnomalies.value = this.recentAnomalies.value.slice(0, this.maxRecentAnomalies)
    }

    // Add to all anomalies (newest first)
    this.allAnomalies.value.unshift(alert)
    if (this.allAnomalies.value.length > this.maxAllAnomalies) {
      this.allAnomalies.value = this.allAnomalies.value.slice(0, this.maxAllAnomalies)
    }
  }

  requestAnomalyStatus(): void {
    if (this.socket?.connected) {
      this.socket.emit('get-anomaly-status')
    }
  }

  async initiateEmergencyLanding(): Promise<void> {
    if (this.emergencyLandingInProgress.value) {
      return
    }

    try {
      // Send emergency landing request to backend
      if (this.socket?.connected) {
        this.socket.emit('emergency-landing-initiate')
      }

      // Set emergency state
      this.emergencyMode.value = true
      this.emergencyLandingInProgress.value = true

      // Stop real telemetry and start simulation
      this.startEmergencyLandingSimulation()

      console.log('🚨 Emergency landing initiated')
    } catch (error) {
      console.error('Failed to initiate emergency landing:', error)
      throw error
    }
  }

  async initiateQuickLanding(): Promise<void> {
    if (!this.emergencyLandingInProgress.value || this.isQuickLandingMode.value) {
      return
    }

    this.isQuickLandingMode.value = true
    console.log('⚡ Quick landing mode activated - completing in 10 seconds')

    // Clear the current simulation interval and start quick landing
    if (this.emergencySimulationInterval) {
      clearInterval(this.emergencySimulationInterval)
      this.emergencySimulationInterval = null
    }

    this.startQuickLandingSimulation()
  }

  private startEmergencyLandingSimulation(): void {
    // Clear any existing simulation
    if (this.emergencySimulationInterval) {
      clearInterval(this.emergencySimulationInterval)
    }

    // Get current telemetry as starting point
    const lastMessage = this.telemetryMessages.value[0]
    if (!lastMessage) return

    let currentAltitude = lastMessage.altitude
    let currentVelocity = -50 // Initial descent velocity
    let simulationTime = 0

    // Set rocket to abort status
    this.currentRocketStatus.value = 'abort'

    this.emergencySimulationInterval = setInterval(() => {
      simulationTime += 1

      // Calculate emergency descent physics
      const gravity = 9.81
      const dragCoefficient = 2.5 // Higher drag for emergency landing
      const parachuteDeployed = currentAltitude < 5000

      // Adjust descent rate based on altitude
      if (parachuteDeployed) {
        currentVelocity = Math.max(currentVelocity, -15) // Terminal velocity with parachute
        dragCoefficient * 2
      } else {
        currentVelocity -= gravity * 0.5 // Deceleration due to drag
        currentVelocity = Math.max(currentVelocity, -200) // Max descent rate
      }

      // Update altitude
      currentAltitude += currentVelocity
      currentAltitude = Math.max(0, currentAltitude)

      // Create simulated telemetry message
      const simulatedMessage: TelemetryMessage = {
        ...lastMessage,
        timestamp: new Date().toISOString(),
        missionTime: lastMessage.missionTime + simulationTime,
        status: currentAltitude <= 10 ? 'landed' : 'descent',
        altitude: currentAltitude,
        velocity: currentVelocity,
        acceleration: gravity + (dragCoefficient * Math.abs(currentVelocity) / 10),
        thrust: 0, // No thrust during emergency landing
        fuelRemaining: lastMessage.fuelRemaining,
        dragForce: dragCoefficient * Math.abs(currentVelocity)
      }

      // Add simulated message (but don't trigger normal processing)
      this.addSimulatedTelemetryMessage(simulatedMessage)

      // Check if landed
      if (currentAltitude <= 0) {
        this.completeEmergencyLanding()
      }
    }, 1000) // Update every second
  }

  private startQuickLandingSimulation(): void {
    const lastMessage = this.telemetryMessages.value[0]
    if (!lastMessage) return

    let currentAltitude = lastMessage.altitude
    let simulationTime = 0
    const quickLandingDuration = 10 // 10 seconds to complete landing
    const altitudeDecrement = currentAltitude / quickLandingDuration // Calculate descent per second

    console.log(`⚡ Starting quick landing: ${currentAltitude}m to 0m in ${quickLandingDuration}s`)

    this.emergencySimulationInterval = setInterval(() => {
      simulationTime += 1

      // Quick descent calculation
      currentAltitude -= altitudeDecrement
      currentAltitude = Math.max(0, currentAltitude)

      // Calculate quick descent velocity
      const currentVelocity = -altitudeDecrement // Constant descent rate

      // Create simulated telemetry message for quick landing
      const simulatedMessage: TelemetryMessage = {
        ...lastMessage,
        timestamp: new Date().toISOString(),
        missionTime: lastMessage.missionTime + simulationTime,
        status: currentAltitude <= 10 ? 'landed' : 'descent',
        altitude: currentAltitude,
        velocity: currentVelocity,
        acceleration: 0, // Controlled descent
        thrust: 0,
        fuelRemaining: lastMessage.fuelRemaining,
        dragForce: 50000 // High drag for quick controlled descent
      }

      // Add simulated message
      this.addSimulatedTelemetryMessage(simulatedMessage)

      // Check if landed or time is up
      if (currentAltitude <= 0 || simulationTime >= quickLandingDuration) {
        console.log(`⚡ Quick landing completed in ${simulationTime}s`)
        this.completeEmergencyLanding()
      }
    }, 1000) // Update every second
  }

  private addSimulatedTelemetryMessage(message: TelemetryMessage): void {
    // Check if emergency landing is still active before adding simulated data
    if (!this.emergencyLandingInProgress.value && !this.isQuickLandingMode.value) {
      console.log('🛑 Skipping simulated telemetry - Emergency landing no longer active')
      return
    }

    // Add to telemetry messages but skip normal processing
    this.telemetryMessages.value.unshift(message)

    if (this.telemetryMessages.value.length > this.maxMessages) {
      this.telemetryMessages.value = this.telemetryMessages.value.slice(0, this.maxMessages)
    }

    // Update rocket status for simulation
    if (message.status !== this.currentRocketStatus.value) {
      this.currentRocketStatus.value = message.status
    }
  }

  private completeEmergencyLanding(): void {
    if (this.emergencySimulationInterval) {
      clearInterval(this.emergencySimulationInterval)
      this.emergencySimulationInterval = null
    }

    this.emergencyLandingInProgress.value = false
    this.currentRocketStatus.value = 'landed'

    // Stop processing all telemetry data once emergency landing is complete
    this.stopTelemetryProcessing()

    console.log('✅ Emergency landing completed successfully - Telemetry processing stopped')
  }

  private stopTelemetryProcessing(): void {
    // Mark that telemetry processing should be stopped
    this.emergencyMode.value = true
    console.log('🛑 Telemetry processing stopped after emergency landing completion')
  }

  public resetEmergencyState(): void {
    console.log('🔄 Starting emergency state reset...')

    // Step 1: Stop all simulation intervals immediately
    this.stopAllSimulations()

    // Step 2: Notify backend to stop any server-side emergency simulation
    this.notifyBackendEmergencyReset()

    // Step 3: Reset emergency state variables
    this.emergencyLandingInProgress.value = false
    this.isQuickLandingMode.value = false
    this.currentRocketStatus.value = 'prelaunch'

    // Step 4: Clean up all data for fresh start (but delay telemetry resumption)
    this.resetAllDataForFreshStartWithDelay()

    console.log('🔄 Emergency state reset completed - All data cleaned for fresh start')
  }

  private stopAllSimulations(): void {
    // Clear any existing emergency simulation intervals
    if (this.emergencySimulationInterval) {
      clearInterval(this.emergencySimulationInterval)
      this.emergencySimulationInterval = null
      console.log('🛑 Emergency simulation interval cleared')
    }

    // Keep emergency mode active temporarily to block any incoming data
    this.emergencyMode.value = true
    console.log('🛑 Emergency mode maintained to block incoming telemetry')
  }

  private notifyBackendEmergencyReset(): void {
    // Send reset signal to backend to stop any server-side simulation
    if (this.socket?.connected) {
      this.socket.emit('emergency-reset')
      console.log('📡 Backend notified of emergency reset')
    }
  }

  private resetAllDataForFreshStartWithDelay(): void {
    // Immediately clear all UI data
    this.clearAllUIData()

    // Wait a moment for any pending operations to complete, then resume telemetry
    setTimeout(() => {
      this.resumeTelemetryProcessing()
    }, 1000) // 1-second delay to ensure cleanup is complete
  }

  private clearAllUIData(): void {
    // Clear all telemetry data
    this.telemetryMessages.value.splice(0, this.telemetryMessages.value.length)
    this.kafkaStatus.messagesReceived = 0

    // Clear all anomaly data
    this.recentAnomalies.value.splice(0, this.recentAnomalies.value.length)
    this.allAnomalies.value.splice(0, this.allAnomalies.value.length)
    this.anomalyStatus.anomaliesReceived = 0

    // Reset rocket status and history
    this.currentRocketStatus.value = 'prelaunch'
    this.statusHistory.value.splice(0, this.statusHistory.value.length)

    // Reset celebration state
    this.resetCelebrationState()

    console.log('🧹 All UI data cleared immediately')
  }

  private resetAllDataForFreshStart(): void {
    // Clear all telemetry data
    this.telemetryMessages.value.splice(0, this.telemetryMessages.value.length)
    this.kafkaStatus.messagesReceived = 0

    // Clear all anomaly data
    this.recentAnomalies.value.splice(0, this.recentAnomalies.value.length)
    this.allAnomalies.value.splice(0, this.allAnomalies.value.length)
    this.anomalyStatus.anomaliesReceived = 0

    // Reset rocket status and history
    this.currentRocketStatus.value = 'prelaunch'
    this.statusHistory.value.splice(0, this.statusHistory.value.length)

    // Reset celebration state
    this.resetCelebrationState()

    // Resume telemetry processing for new missions
    this.resumeTelemetryProcessing()

    console.log('🧹 All data cleaned for fresh UI start - Ready for new mission')
  }

  private resumeTelemetryProcessing(): void {
    // Allow telemetry processing to resume
    this.emergencyMode.value = false
    
    // Reconnect to get fresh status (but only request status, don't generate data)
    if (this.socket?.connected) {
      console.log('📡 Requesting fresh connection status after reset')
      // Only request status updates, avoid any data generation
      this.requestKafkaStatus()
      this.requestAnomalyStatus()
    }
    
    console.log('▶️ Telemetry processing resumed - Ready for new mission data')
  }
}

export const websocketService = new WebSocketService()
