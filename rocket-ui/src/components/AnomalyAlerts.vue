<template>
  <div class="anomaly-alerts-panel">
    <div class="alerts-header">
      <h3>System Alerts</h3>
      <div class="alert-indicators">
        <div v-if="criticalCount > 0" :class="['alert-badge', 'critical']">
          {{ criticalCount }}
        </div>
        <div v-if="highCount > 0" :class="['alert-badge', 'high']">
          {{ highCount }}
        </div>
        <div v-if="mediumCount > 0" :class="['alert-badge', 'medium']">
          {{ mediumCount }}
        </div>
      </div>
    </div>
    
    <div class="anomaly-status-row">
      <div :class="['status-indicator', anomalyStatus.state]"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <div v-if="anomalyStatus.state === 'connected'" class="anomaly-info">
      <div class="info-item">
        <span class="label">Alerts:</span>
        <span class="value">{{ anomalyStatus.anomaliesReceived }}</span>
      </div>
    </div>
    
    <div v-if="recentAlerts.length > 0" class="recent-alerts">
      <div class="alerts-title">Recent Alerts</div>
      <div 
        v-for="alert in recentAlerts" 
        :key="alert.alertId"
        :class="['alert-item', alert.severity]"
      >
        <div class="alert-main">
          <div class="alert-type">{{ formatAnomalyType(alert.anomalyType) }}</div>
          <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
        </div>
        <div class="alert-details">
          <span class="alert-rocket">{{ alert.rocketId }}</span>
          <span class="alert-parameter">{{ alert.affectedParameter }}</span>
          <span class="alert-value">{{ alert.currentValue }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="anomalyStatus.lastError && anomalyStatus.state === 'error'" class="error-info">
      <span class="error-text">{{ anomalyStatus.lastError }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { websocketService } from '@/services/websocket.service';
import type { AnomalyAlert } from '@/types/anomaly.types';

const anomalyStatus = websocketService.anomalyStatus;
const recentAlerts = websocketService.recentAnomalies;

const statusText = computed(() => {
  switch (anomalyStatus.state) {
    case 'connecting':
      return 'Connecting to Anomaly Detection...';
    case 'connected':
      return 'Anomaly Detection Active';
    case 'disconnected':
      return 'Anomaly Detection Offline';
    case 'error':
      return 'Anomaly Detection Error';
    default:
      return 'Unknown';
  }
});

const criticalCount = computed(() => 
  recentAlerts.value.filter(alert => alert.severity === 'critical').length
);

const highCount = computed(() => 
  recentAlerts.value.filter(alert => alert.severity === 'high').length
);

const mediumCount = computed(() => 
  recentAlerts.value.filter(alert => alert.severity === 'medium').length
);

const formatAnomalyType = (type: string): string => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

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

onMounted(() => {
  websocketService.requestAnomalyStatus();
});
</script>

<style scoped>
.anomaly-alerts-panel {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  backdrop-filter: blur(10px);
  min-width: 320px;
  max-width: 400px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.alerts-header h3 {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.alert-indicators {
  display: flex;
  gap: 4px;
}

.alert-badge {
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.alert-badge.critical {
  background: #9c27b0;
  animation: pulse-critical 1s ease-in-out infinite;
}

.alert-badge.high {
  background: #f44336;
}

.alert-badge.medium {
  background: #ff9800;
}

.anomaly-status-row {
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

.anomaly-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
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

.recent-alerts {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.alerts-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.alert-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 6px;
  border-left: 3px solid;
  animation: slideIn 0.3s ease-out;
}

.alert-item.critical {
  border-left-color: #9c27b0;
  background: rgba(156, 39, 176, 0.1);
}

.alert-item.high {
  border-left-color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.alert-item.medium {
  border-left-color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
}

.alert-item.low {
  border-left-color: #ffc107;
  background: rgba(255, 193, 7, 0.1);
}

.alert-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.alert-type {
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

.alert-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  font-family: monospace;
}

.alert-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.alert-rocket {
  color: #4caf50;
  font-weight: 500;
}

.alert-parameter {
  color: rgba(255, 255, 255, 0.7);
}

.alert-value {
  color: #ffffff;
  font-family: monospace;
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

@keyframes pulse-critical {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.7);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
    box-shadow: 0 0 0 4px rgba(156, 39, 176, 0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.recent-alerts::-webkit-scrollbar {
  width: 4px;
}

.recent-alerts::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.recent-alerts::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

@media (max-width: 480px) {
  .anomaly-alerts-panel {
    min-width: 280px;
    padding: 14px 16px;
  }
  
  .alerts-header h3 {
    font-size: 15px;
  }
  
  .status-text,
  .alert-type {
    font-size: 13px;
  }
  
  .label,
  .value,
  .alert-details {
    font-size: 11px;
  }
}
</style>