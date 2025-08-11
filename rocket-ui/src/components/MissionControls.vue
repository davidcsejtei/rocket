<template>
  <div class="mission-controls">
    <h3 class="controls-title">Mission Controls</h3>
    
    <div class="controls-grid">
      <button 
        class="reset-button telemetry"
        @click="showResetTelemetryDialog"
        :disabled="isLoading"
        title="Clear all telemetry data from the system"
      >
        <span class="button-icon">📡</span>
        <span class="button-text">Reset Telemetry Data</span>
      </button>
      
      <button 
        class="reset-button anomalies"
        @click="showResetAnomaliesDialog"
        :disabled="isLoading"
        title="Clear all anomaly alerts from the system"
      >
        <span class="button-icon">🚨</span>
        <span class="button-text">Reset Anomalies</span>
      </button>
    </div>
    
    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      <span class="success-icon">✅</span>
      {{ successMessage }}
    </div>
    
    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      <span class="error-icon">❌</span>
      {{ errorMessage }}
    </div>
    
    <!-- Confirmation Dialog -->
    <ConfirmationDialog
      :visible="confirmationDialog.visible"
      :title="confirmationDialog.title"
      :message="confirmationDialog.message"
      :details="confirmationDialog.details"
      :confirm-text="confirmationDialog.confirmText"
      :loading="isLoading"
      @confirm="handleConfirmation"
      @cancel="hideConfirmationDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ConfirmationDialog from './ConfirmationDialog.vue'
import { websocketService } from '@/services/websocket.service'

interface ConfirmationState {
  visible: boolean
  title: string
  message: string
  details: string[]
  confirmText: string
  action: 'telemetry' | 'anomalies' | null
}

const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const confirmationDialog = reactive<ConfirmationState>({
  visible: false,
  title: '',
  message: '',
  details: [],
  confirmText: '',
  action: null,
})

const showResetTelemetryDialog = () => {
  confirmationDialog.visible = true
  confirmationDialog.title = 'Reset Telemetry Data'
  confirmationDialog.message = 'Are you sure you want to clear all telemetry data?'
  confirmationDialog.details = [
    'All telemetry messages will be permanently deleted',
    'Kafka rocket-telemetry topic will be cleared',
    'UI telemetry display will be reset',
    'Mission celebration state will be reset'
  ]
  confirmationDialog.confirmText = 'Reset Telemetry'
  confirmationDialog.action = 'telemetry'
  
  clearMessages()
}

const showResetAnomaliesDialog = () => {
  confirmationDialog.visible = true
  confirmationDialog.title = 'Reset Anomaly Data'
  confirmationDialog.message = 'Are you sure you want to clear all anomaly alerts?'
  confirmationDialog.details = [
    'All anomaly alerts will be permanently deleted',
    'Kafka rocket-anomalies topic will be cleared',
    'UI anomaly display will be reset',
    'Anomaly history will be cleared'
  ]
  confirmationDialog.confirmText = 'Reset Anomalies'
  confirmationDialog.action = 'anomalies'
  
  clearMessages()
}

const hideConfirmationDialog = () => {
  if (!isLoading.value) {
    confirmationDialog.visible = false
    confirmationDialog.action = null
  }
}

const handleConfirmation = async () => {
  if (isLoading.value || !confirmationDialog.action) return
  
  isLoading.value = true
  clearMessages()
  
  try {
    if (confirmationDialog.action === 'telemetry') {
      await resetTelemetryData()
    } else if (confirmationDialog.action === 'anomalies') {
      await resetAnomalyData()
    }
  } catch (error) {
    console.error('Reset operation failed:', error)
  } finally {
    isLoading.value = false
    hideConfirmationDialog()
  }
}

const resetTelemetryData = async () => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${apiBaseUrl}/api/admin/reset-telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const result = await response.json()
    
    if (result.success) {
      // Clear frontend state
      websocketService.resetTelemetryData()
      
      successMessage.value = result.message
      if (result.clearedMessages) {
        successMessage.value += ` (${result.clearedMessages} messages cleared)`
      }
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
      
    } else {
      errorMessage.value = result.message || 'Failed to reset telemetry data'
      setTimeout(() => {
        errorMessage.value = ''
      }, 5000)
    }
  } catch (error) {
    errorMessage.value = 'Network error: Could not reset telemetry data'
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  }
}

const resetAnomalyData = async () => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${apiBaseUrl}/api/admin/reset-anomalies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const result = await response.json()
    
    if (result.success) {
      // Clear frontend state
      websocketService.resetAnomalyData()
      
      successMessage.value = result.message
      if (result.clearedAnomalies) {
        successMessage.value += ` (${result.clearedAnomalies} anomalies cleared)`
      }
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
      
    } else {
      errorMessage.value = result.message || 'Failed to reset anomaly data'
      setTimeout(() => {
        errorMessage.value = ''
      }, 5000)
    }
  } catch (error) {
    errorMessage.value = 'Network error: Could not reset anomaly data'
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  }
}

const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}
</script>

<style scoped>
.mission-controls {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.2rem;
  backdrop-filter: blur(10px);
}

.controls-title {
  color: #e0e0e0;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.controls-title::before {
  content: '⚙️';
  font-size: 1.2rem;
}

.controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.reset-button {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.8rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 70px;
  justify-content: center;
}

.reset-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, rgba(118, 75, 162, 0.9) 0%, rgba(102, 126, 234, 0.9) 100%);
}

.reset-button:active:not(:disabled) {
  transform: translateY(0);
}

.reset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.reset-button.telemetry:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
}

.reset-button.anomalies:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.button-icon {
  font-size: 1.4rem;
}

.button-text {
  text-align: center;
  line-height: 1.2;
}

.success-message {
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid rgba(46, 213, 115, 0.3);
  border-radius: 8px;
  padding: 0.8rem;
  color: #2ed573;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: slideIn 0.3s ease-out;
}

.error-message {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  padding: 0.8rem;
  color: #ff6b6b;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: slideIn 0.3s ease-out;
}

.success-icon,
.error-icon {
  font-size: 1rem;
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

@media (max-width: 768px) {
  .controls-grid {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
  
  .reset-button {
    flex-direction: row;
    min-height: auto;
    padding: 0.7rem 1rem;
    font-size: 0.8rem;
  }
  
  .button-icon {
    font-size: 1.2rem;
  }
}
</style>