<template>
  <div v-if="visible" class="celebration-overlay" @click="handleOverlayClick">
    <div class="celebration-popup" @click.stop>
      <div class="confetti-container">
        <div v-for="i in 50" :key="i" class="confetti" :style="getConfettiStyle(i)"></div>
      </div>
      
      <div class="celebration-content">
        <div class="celebration-header">
          <h1 class="celebration-title">🚀 MISSION SUCCESS! 🎉</h1>
          <p class="achievement-message">Rocket has reached 100km altitude - The Kármán Line!</p>
        </div>
        
        <div class="mission-details">
          <div class="detail-row">
            <span class="detail-label">Final Altitude:</span>
            <span class="detail-value highlight">{{ formatAltitude(finalAltitude) }}m</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Rocket ID:</span>
            <span class="detail-value">{{ rocketId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Mission Time:</span>
            <span class="detail-value">{{ formatTime(missionTime) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Achievement:</span>
            <span class="detail-value success">Space Boundary Reached! 🌌</span>
          </div>
        </div>
        
        <div class="celebration-actions">
          <button class="celebrate-button" @click="celebrate">
            🎉 Celebrate!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Props {
  visible: boolean
  finalAltitude: number
  rocketId: string
  missionTime: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  dismiss: []
}>()

const celebrate = () => {
  emit('dismiss')
}

const handleOverlayClick = () => {
  emit('dismiss')
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('dismiss')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress)
  
  // Auto-dismiss after 10 seconds
  if (props.visible) {
    setTimeout(() => {
      emit('dismiss')
    }, 10000)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress)
})

const formatAltitude = (altitude: number): string => {
  return altitude.toLocaleString()
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const getConfettiStyle = (index: number) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7']
  const delay = Math.random() * 3
  const duration = 3 + Math.random() * 2
  const left = Math.random() * 100
  
  return {
    left: `${left}%`,
    backgroundColor: colors[index % colors.length],
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}
</script>

<style scoped>
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.celebration-popup {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: popIn 0.5s ease-out 0.2s both;
  overflow: hidden;
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #ff6b6b;
  animation: confettiFall linear infinite;
  transform-origin: center;
}

.celebration-content {
  position: relative;
  color: white;
  text-align: center;
}

.celebration-header {
  margin-bottom: 2rem;
}

.celebration-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  animation: bounce 1s ease-in-out infinite alternate;
}

.achievement-message {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
}

.mission-details {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  font-size: 1.1rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 500;
  opacity: 0.8;
}

.detail-value {
  font-weight: bold;
}

.detail-value.highlight {
  color: #f9ca24;
  font-size: 1.3rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.detail-value.success {
  color: #2ed573;
}

.celebration-actions {
  margin-top: 1rem;
}

.celebrate-button {
  background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(249, 202, 36, 0.4);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.celebrate-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(249, 202, 36, 0.6);
}

.celebrate-button:active {
  transform: translateY(0);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes bounce {
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
}

@keyframes confettiFall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .celebration-popup {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .celebration-title {
    font-size: 2rem;
  }
  
  .detail-row {
    font-size: 1rem;
    flex-direction: column;
    gap: 0.3rem;
    text-align: center;
  }
  
  .detail-value.highlight {
    font-size: 1.2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .confetti,
  .celebration-title,
  .celebration-popup {
    animation: none;
  }
  
  .celebrate-button:hover {
    transform: none;
  }
}
</style>