<template>
  <div class="connection-panel">
    <div class="status-row">
      <div :class="['status-indicator', connectionStatus.state]"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>

    <div v-if="connectionStatus.state === 'connected'" class="connection-info">
      <div class="info-item">
        <span class="label">Uptime:</span>
        <span class="value">{{ uptime }}</span>
      </div>
    </div>

    <div v-if="connectionStatus.state === 'reconnecting'" class="connection-info">
      <div class="info-item">
        <span class="label">Attempt:</span>
        <span class="value">{{ connectionStatus.reconnectAttempts }}/5</span>
      </div>
    </div>

    <div v-if="connectionStatus.lastError && connectionStatus.state === 'error'" class="error-info">
      <span class="error-text">{{ connectionStatus.lastError }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { websocketService } from '@/services/websocket.service'

const connectionStatus = websocketService.connectionStatus
const uptime = ref('0s')
let uptimeInterval: number | null = null

const statusText = computed(() => {
  switch (connectionStatus.state) {
    case 'connecting':
      return 'Connecting...'
    case 'connected':
      return 'Connected to Mission Control'
    case 'disconnected':
      return 'Disconnected'
    case 'reconnecting':
      return 'Reconnecting...'
    case 'error':
      return 'Connection Error'
    default:
      return 'Unknown'
  }
})

const updateUptime = (): void => {
  uptime.value = websocketService.getUptime()
}

onMounted(() => {
  websocketService.connect()

  uptimeInterval = setInterval(updateUptime, 1000)
})

onUnmounted(() => {
  if (uptimeInterval) {
    clearInterval(uptimeInterval)
  }
  websocketService.disconnect()
})
</script>

<style scoped>
.connection-panel {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  backdrop-filter: blur(10px);
  min-width: 280px;
  max-width: 400px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.status-indicator.connecting {
  background: #ffc107;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-indicator.connected {
  background: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
}

.status-indicator.disconnected {
  background: #666;
}

.status-indicator.reconnecting {
  background: #ff9800;
  animation: pulse 1s ease-in-out infinite;
}

.status-indicator.error {
  background: #f44336;
}

.status-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}

.connection-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.value {
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
}

.error-info {
  margin-top: 8px;
}

.error-text {
  color: #f44336;
  font-size: 12px;
  word-break: break-word;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

@media (max-width: 480px) {
  .connection-panel {
    min-width: 240px;
    padding: 14px 16px;
  }

  .status-text {
    font-size: 13px;
  }

  .label,
  .value,
  .error-text {
    font-size: 11px;
  }
}
</style>
