<template>
  <div v-if="showEmergency" class="emergency-container">
    <div class="emergency-alert" :class="{ 'emergency-active': !emergencyLandingInProgress }">
      <div class="emergency-icon">⚠️</div>
      
      <div v-if="!emergencyLandingInProgress" class="emergency-content">
        <h2 class="emergency-title">HIGH ANOMALY DETECTED</h2>
        <p class="emergency-message">
          Critical system anomaly requires immediate attention
        </p>
        <button 
          class="emergency-button"
          @click="initiateEmergencyShutdown"
          :disabled="isShuttingDown"
        >
          {{ isShuttingDown ? 'INITIATING...' : 'EMERGENCY SHUTDOWN' }}
        </button>
      </div>

      <div v-else class="emergency-landing-status">
        <h2 class="emergency-title">EMERGENCY LANDING IN PROGRESS</h2>
        <div class="landing-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: landingProgress + '%' }"
            ></div>
          </div>
          <p class="progress-text">{{ Math.round(landingProgress) }}% Complete</p>
        </div>
        <div class="landing-stats">
          <div class="stat">
            <span class="stat-label">Altitude:</span>
            <span class="stat-value">{{ currentAltitude }}m</span>
          </div>
          <div class="stat">
            <span class="stat-label">Descent Rate:</span>
            <span class="stat-value">{{ descentRate }}m/s</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Emergency Landing Success Message -->
    <div v-if="emergencyLandingComplete" class="landing-success-overlay">
      <div class="success-message">
        <div class="success-icon">✅</div>
        <h2>EMERGENCY LANDING SUCCESSFUL</h2>
        <p>Rocket has safely landed at altitude {{ finalAltitude }}m</p>
        <div class="landing-impact-data">
          <div class="impact-stat">
            <span>Final Velocity:</span>
            <span>{{ finalVelocity }}m/s</span>
          </div>
          <div class="impact-stat">
            <span>Landing Duration:</span>
            <span>{{ landingDuration }}s</span>
          </div>
        </div>
        <button class="reset-button" @click="resetEmergencyState">
          RESET SYSTEM
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { websocketService } from '@/services/websocket.service';

const isShuttingDown = ref(false);
const emergencyLandingInProgress = ref(false);
const emergencyLandingComplete = ref(false);
const landingStartTime = ref(0);

const showEmergency = computed(() => {
  const alerts = websocketService.priorityAlerts.value;
  return alerts.some(alert => alert.severity === 'high' || alert.severity === 'critical') || 
         emergencyLandingInProgress.value || 
         emergencyLandingComplete.value;
});

const currentTelemetry = computed(() => {
  const messages = websocketService.telemetryMessages.value;
  return messages.length > 0 ? messages[0] : null;
});

const currentAltitude = computed(() => {
  return currentTelemetry.value ? Math.round(currentTelemetry.value.altitude) : 0;
});

const descentRate = computed(() => {
  return currentTelemetry.value ? Math.abs(Math.round(currentTelemetry.value.velocity)) : 0;
});

const landingProgress = computed(() => {
  if (!emergencyLandingInProgress.value || !currentTelemetry.value) return 0;
  const startAltitude = 100000; // Approximate starting altitude
  const currentAlt = currentTelemetry.value.altitude;
  const progress = ((startAltitude - currentAlt) / startAltitude) * 100;
  return Math.max(0, Math.min(100, progress));
});

const finalAltitude = ref(0);
const finalVelocity = ref(0);
const landingDuration = ref(0);

const initiateEmergencyShutdown = async () => {
  isShuttingDown.value = true;
  
  try {
    await websocketService.initiateEmergencyLanding();
    emergencyLandingInProgress.value = true;
    landingStartTime.value = Date.now();
  } catch (error) {
    console.error('Failed to initiate emergency landing:', error);
  } finally {
    isShuttingDown.value = false;
  }
};

const resetEmergencyState = () => {
  emergencyLandingComplete.value = false;
  emergencyLandingInProgress.value = false;
  websocketService.resetEmergencyState();
};

// Watch for emergency landing completion
watch(currentTelemetry, (newTelemetry) => {
  if (emergencyLandingInProgress.value && newTelemetry) {
    // Check if landed (altitude <= 10m)
    if (newTelemetry.altitude <= 10 && newTelemetry.status === 'landed') {
      emergencyLandingInProgress.value = false;
      emergencyLandingComplete.value = true;
      
      finalAltitude.value = Math.round(newTelemetry.altitude);
      finalVelocity.value = Math.round(Math.abs(newTelemetry.velocity));
      landingDuration.value = Math.round((Date.now() - landingStartTime.value) / 1000);
    }
  }
});
</script>

<style scoped>
.emergency-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
}

.emergency-alert {
  background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
  color: white;
  padding: 16px 24px;
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(244, 67, 54, 0.4);
  display: flex;
  align-items: center;
  gap: 16px;
  pointer-events: auto;
  border: 2px solid #ff5722;
}

.emergency-active {
  animation: emergency-pulse 1s ease-in-out infinite;
}

.emergency-icon {
  font-size: 32px;
  animation: icon-flash 0.8s ease-in-out infinite alternate;
}

.emergency-content,
.emergency-landing-status {
  flex: 1;
}

.emergency-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.emergency-message {
  margin: 0 0 16px 0;
  font-size: 16px;
  opacity: 0.9;
}

.emergency-button {
  background: #ffffff;
  color: #d32f2f;
  border: none;
  padding: 12px 24px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;
}

.emergency-button:hover:not(:disabled) {
  background: #f5f5f5;
  transform: scale(1.05);
}

.emergency-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.landing-progress {
  margin: 16px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
  transition: width 0.3s ease;
}

.progress-text {
  margin: 8px 0 0 0;
  font-size: 14px;
  text-align: center;
}

.landing-stats {
  display: flex;
  gap: 32px;
  margin-top: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  text-transform: uppercase;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
}

.landing-success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  pointer-events: auto;
}

.success-message {
  background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
  color: white;
  padding: 48px;
  border-radius: 16px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.3);
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.success-message h2 {
  margin: 0 0 16px 0;
  font-size: 28px;
}

.success-message p {
  margin: 0 0 24px 0;
  font-size: 16px;
  opacity: 0.9;
}

.landing-impact-data {
  display: flex;
  justify-content: space-around;
  margin: 24px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.impact-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.impact-stat span:first-child {
  font-size: 12px;
  opacity: 0.8;
  text-transform: uppercase;
}

.impact-stat span:last-child {
  font-size: 18px;
  font-weight: bold;
}

.reset-button {
  background: white;
  color: #4caf50;
  border: none;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button:hover {
  background: #f5f5f5;
  transform: scale(1.05);
}

@keyframes emergency-pulse {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(244, 67, 54, 0.4);
  }
  50% {
    box-shadow: 0 8px 32px rgba(244, 67, 54, 0.8);
  }
}

@keyframes icon-flash {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@media (max-width: 768px) {
  .emergency-alert {
    margin: 8px;
    padding: 12px 16px;
    flex-direction: column;
    text-align: center;
  }
  
  .emergency-title {
    font-size: 20px;
  }
  
  .landing-stats {
    justify-content: center;
    gap: 24px;
  }
  
  .success-message {
    margin: 16px;
    padding: 32px 24px;
  }
  
  .landing-impact-data {
    flex-direction: column;
    gap: 16px;
  }
}
</style>