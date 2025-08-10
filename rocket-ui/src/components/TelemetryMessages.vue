<template>
  <div class="telemetry-panel">
    <div class="panel-header">
      <h3>Live Telemetry</h3>
      <span v-if="messages.length > 0" class="message-count">{{ messages.length }} messages</span>
    </div>
    
    <div class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <span>No telemetry data received yet</span>
      </div>
      
      <div
        v-for="message in messages"
        :key="`${message.rocketId}-${message.timestamp}`"
        :class="['message-card', `status-${message.status}`]"
      >
        <div class="message-header">
          <span class="rocket-id">{{ message.rocketId }}</span>
          <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
        </div>
        
        <div class="telemetry-data">
          <div class="data-row">
            <span class="data-label">Altitude:</span>
            <span class="data-value">{{ formatNumber(message.altitude) }}m</span>
          </div>
          <div class="data-row">
            <span class="data-label">Velocity:</span>
            <span class="data-value">{{ formatNumber(message.velocity) }}m/s</span>
          </div>
          <div class="data-row">
            <span class="data-label">Fuel:</span>
            <span class="data-value">{{ Math.round(message.fuel) }}%</span>
          </div>
          <div class="data-row">
            <span class="data-label">Temp:</span>
            <span class="data-value">{{ Math.round(message.temperature) }}°C</span>
          </div>
        </div>
        
        <div class="status-badge">
          <span :class="['status-text', `status-${message.status}`]">
            {{ formatStatus(message.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { websocketService } from '@/services/websocket.service';
import type { TelemetryMessage } from '@/types/telemetry.types';

const messages = websocketService.telemetryMessages;
const messagesContainer = ref<HTMLElement>();

const formatTime = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return 'Invalid time';
  }
};

const formatNumber = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
};

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

watch(
  () => messages.length,
  async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = 0;
    }
  }
);
</script>

<style scoped>
.telemetry-panel {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  backdrop-filter: blur(10px);
  min-width: 320px;
  max-width: 450px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.message-count {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  text-align: center;
}

.message-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease-out;
}

.message-card.status-launching {
  border-left: 3px solid #ff9800;
}

.message-card.status-flight {
  border-left: 3px solid #2196f3;
}

.message-card.status-landing {
  border-left: 3px solid #ff5722;
}

.message-card.status-landed {
  border-left: 3px solid #4caf50;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rocket-id {
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
}

.timestamp {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-family: monospace;
}

.telemetry-data {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
  margin-bottom: 8px;
}

.data-row {
  display: flex;
  justify-content: space-between;
}

.data-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
}

.data-value {
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
  font-family: monospace;
}

.status-badge {
  display: flex;
  justify-content: flex-end;
}

.status-text {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-text.status-launching {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.status-text.status-flight {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

.status-text.status-landing {
  background: rgba(255, 87, 34, 0.2);
  color: #ff5722;
}

.status-text.status-landed {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

@media (max-width: 480px) {
  .telemetry-panel {
    min-width: 280px;
    padding: 14px 16px;
  }
  
  .panel-header h3 {
    font-size: 15px;
  }
  
  .telemetry-data {
    grid-template-columns: 1fr;
    gap: 2px;
  }
  
  .data-row {
    justify-content: space-between;
  }
}
</style>