<template>
  <div v-if="visible" class="confirmation-overlay" @click="handleOverlayClick">
    <div class="confirmation-dialog" @click.stop>
      <div class="dialog-header">
        <div class="warning-icon">⚠️</div>
        <h3 class="dialog-title">{{ title }}</h3>
      </div>
      
      <div class="dialog-content">
        <p class="warning-message">{{ message }}</p>
        
        <div v-if="details.length > 0" class="warning-details">
          <ul>
            <li v-for="detail in details" :key="detail">{{ detail }}</li>
          </ul>
        </div>
        
        <div class="data-warning">
          <strong>⚠️ Warning:</strong> This action cannot be undone!
        </div>
      </div>
      
      <div class="dialog-actions">
        <button 
          class="cancel-button"
          @click="cancel"
          :disabled="loading"
        >
          Cancel
        </button>
        <button 
          class="confirm-button"
          @click="confirm"
          :disabled="loading"
          :class="{ loading }"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Processing...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  details?: string[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  details: () => [],
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const confirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

const cancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}

const handleOverlayClick = () => {
  if (!props.loading) {
    emit('cancel')
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (!props.visible) return
  
  if (event.key === 'Escape' && !props.loading) {
    emit('cancel')
  } else if (event.key === 'Enter' && !props.loading) {
    emit('confirm')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.confirmation-dialog {
  background: #2a2a2a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease-out;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.warning-icon {
  font-size: 1.5rem;
}

.dialog-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.dialog-content {
  padding: 1.5rem;
  color: #e0e0e0;
}

.warning-message {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  line-height: 1.5;
}

.warning-details {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.warning-details ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 0.9rem;
  color: #b0b0b0;
}

.warning-details li {
  margin-bottom: 0.3rem;
}

.data-warning {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  padding: 0.8rem;
  font-size: 0.9rem;
  color: #ff6b6b;
}

.dialog-actions {
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-button {
  background: transparent;
  color: #b0b0b0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
}

.cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
  justify-content: center;
}

.confirm-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(238, 90, 36, 0.4);
}

.confirm-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.confirm-button.loading {
  background: #666;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .confirmation-dialog {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
  
  .dialog-header {
    padding: 1rem;
  }
  
  .dialog-title {
    font-size: 1.1rem;
  }
  
  .dialog-content {
    padding: 1rem;
  }
  
  .dialog-actions {
    padding: 1rem;
    flex-direction: column;
    gap: 0.8rem;
  }
  
  .cancel-button,
  .confirm-button {
    width: 100%;
  }
}
</style>