<template>
  <div class="kafka-status-panel">
    <div class="status-header">
      <h3>Kafka Status</h3>
    </div>
    
    <div class="status-row">
      <div :class="['status-indicator', connectionStatus.state !== 'connected' ? 'disconnected' : kafkaStatus.state]"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <div v-if="kafkaStatus.state === 'connected' && connectionStatus.state === 'connected'" class="kafka-info">
      <div class="info-item">
        <span class="label">Messages:</span>
        <span class="value">{{ kafkaStatus.messagesReceived }}</span>
      </div>
      <div v-if="kafkaStatus.connectedAt" class="info-item">
        <span class="label">Connected:</span>
        <span class="value">{{ formatTime(kafkaStatus.connectedAt) }}</span>
      </div>
    </div>
    
    <div v-if="kafkaStatus.lastError && (kafkaStatus.state === 'error' || connectionStatus.state !== 'connected')" class="error-info">
      <span class="error-text">{{ connectionStatus.state !== 'connected' ? 'API connection required' : kafkaStatus.lastError }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { websocketService } from '@/services/websocket.service';
import type { KafkaStatus } from '@/types/telemetry.types';

const kafkaStatus = websocketService.kafkaStatus;
const connectionStatus = websocketService.connectionStatus;

const statusText = computed(() => {
  if (connectionStatus.state !== 'connected') {
    return 'API Disconnected';
  }
  
  switch (kafkaStatus.state) {
    case 'connecting':
      return 'Connecting to Kafka...';
    case 'connected':
      return 'Kafka Connected';
    case 'disconnected':
      return 'Kafka Disconnected';
    case 'error':
      return 'Connection Error';
    default:
      return 'Unknown';
  }
});

const formatTime = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return 'Unknown';
  }
};

onMounted(() => {
  websocketService.requestKafkaStatus();
});
</script>

<style scoped>
.kafka-status-panel {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  backdrop-filter: blur(10px);
  min-width: 280px;
  max-width: 400px;
}

.status-header {
  margin-bottom: 12px;
}

.status-header h3 {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
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

.status-indicator.error {
  background: #f44336;
}

.status-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}

.kafka-info {
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
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

@media (max-width: 480px) {
  .kafka-status-panel {
    min-width: 240px;
    padding: 14px 16px;
  }
  
  .status-header h3 {
    font-size: 15px;
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