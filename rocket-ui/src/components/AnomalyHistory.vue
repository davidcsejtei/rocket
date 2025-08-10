<template>
  <div class="anomaly-history-panel">
    <div class="history-header">
      <h3>Anomaly History</h3>
      <span v-if="allAnomalies.length > 0" class="history-count">{{ allAnomalies.length }} total</span>
    </div>
    
    <div class="history-container" ref="historyContainer">
      <div v-if="allAnomalies.length === 0" class="empty-state">
        <span>No anomalies detected yet</span>
      </div>
      
      <div
        v-for="alert in allAnomalies"
        :key="alert.alertId"
        :class="['history-item', alert.severity]"
        @click="selectAlert(alert)"
      >
        <div class="history-main">
          <div class="history-type">{{ formatAnomalyType(alert.anomalyType) }}</div>
          <div class="history-time">{{ formatRelativeTime(alert.timestamp) }}</div>
        </div>
        
        <div class="history-details">
          <div class="detail-row">
            <span class="detail-label">Rocket:</span>
            <span class="detail-value">{{ alert.rocketId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Parameter:</span>
            <span class="detail-value">{{ alert.affectedParameter }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Value:</span>
            <span class="detail-value">{{ formatValue(alert.currentValue) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Expected:</span>
            <span class="detail-value">{{ alert.expectedRange }}</span>
          </div>
        </div>
        
        <div class="history-meta">
          <div :class="['severity-badge', alert.severity]">
            {{ alert.severity.toUpperCase() }}
          </div>
          <div class="mission-time">T+{{ formatMissionTime(alert.missionTime) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { websocketService } from '@/services/websocket.service';
import type { AnomalyAlert } from '@/types/anomaly.types';

const allAnomalies = websocketService.allAnomalies;
const historyContainer = ref<HTMLElement>();

const formatAnomalyType = (type: string): string => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatRelativeTime = (timestamp: string): string => {
  try {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = Math.abs(now - time) / 1000; // seconds
    
    if (diff < 60) {
      return `${Math.floor(diff)}s ago`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`;
    } else {
      return `${Math.floor(diff / 3600)}h ago`;
    }
  } catch {
    return 'Unknown time';
  }
};

const formatMissionTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = (time % 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, '0')}`;
};

const formatValue = (value: number): string => {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  } else {
    return value.toFixed(1);
  }
};

const selectAlert = (alert: AnomalyAlert): void => {
  console.log('Selected anomaly:', alert);
};

watch(
  () => allAnomalies.value.length,
  async () => {
    await nextTick();
    if (historyContainer.value) {
      historyContainer.value.scrollTop = 0;
    }
  }
);
</script>

<style scoped>
.anomaly-history-panel {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  backdrop-filter: blur(10px);
  min-width: 380px;
  max-width: 480px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-header h3 {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.history-count {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.history-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 520px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  text-align: center;
}

.history-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: slideIn 0.3s ease-out;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.history-item.critical {
  border-left: 4px solid #9c27b0;
}

.history-item.high {
  border-left: 4px solid #f44336;
}

.history-item.medium {
  border-left: 4px solid #ff9800;
}

.history-item.low {
  border-left: 4px solid #ffc107;
}

.history-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-type {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.history-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.history-details {
  margin-bottom: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.detail-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  width: 80px;
  flex-shrink: 0;
}

.detail-value {
  color: #ffffff;
  font-size: 12px;
  font-family: monospace;
  text-align: right;
  flex: 1;
}

.history-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.severity-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
}

.severity-badge.critical {
  background: #9c27b0;
}

.severity-badge.high {
  background: #f44336;
}

.severity-badge.medium {
  background: #ff9800;
}

.severity-badge.low {
  background: #ffc107;
  color: #000;
}

.mission-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  font-family: monospace;
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

.history-container::-webkit-scrollbar {
  width: 4px;
}

.history-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.history-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

@media (max-width: 480px) {
  .anomaly-history-panel {
    min-width: 300px;
    padding: 14px 16px;
  }
  
  .history-header h3 {
    font-size: 15px;
  }
  
  .history-type {
    font-size: 13px;
  }
  
  .detail-label,
  .detail-value {
    font-size: 11px;
  }
  
  .detail-label {
    width: 70px;
  }
}
</style>