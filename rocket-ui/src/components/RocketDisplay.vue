<template>
  <div class="rocket-container">
    <div class="rocket-content">
      <svg
        class="rocket-svg"
        viewBox="0 0 100 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Rocket body -->
        <ellipse cx="50" cy="50" rx="12" ry="30" fill="#e0e0e0" />
        
        <!-- Rocket tip -->
        <polygon points="50,20 38,50 62,50" fill="#ff6b6b" />
        
        <!-- Rocket fins -->
        <polygon points="35,70 25,90 35,85" fill="#4ecdc4" />
        <polygon points="65,70 75,90 65,85" fill="#4ecdc4" />
        
        <!-- Rocket window -->
        <circle cx="50" cy="40" r="5" fill="#87ceeb" />
        
        <!-- Flame base -->
        <g class="flames">
          <!-- Main flame -->
          <ellipse 
            cx="50" 
            cy="85" 
            rx="8" 
            ry="15" 
            fill="url(#flameGradient)"
            class="main-flame"
          />
          
          <!-- Left flame -->
          <ellipse 
            cx="45" 
            cy="88" 
            rx="4" 
            ry="12" 
            fill="url(#flameGradient2)"
            class="side-flame left-flame"
          />
          
          <!-- Right flame -->
          <ellipse 
            cx="55" 
            cy="88" 
            rx="4" 
            ry="12" 
            fill="url(#flameGradient2)"
            class="side-flame right-flame"
          />
        </g>
        
        <!-- Gradient definitions -->
        <defs>
          <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ffeb3b;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#ff9800;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f44336;stop-opacity:1" />
          </linearGradient>
          
          <linearGradient id="flameGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ffc107;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#ff5722;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d32f2f;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
      
      <div class="status-panels">
        <ConnectionStatus />
        <KafkaStatus />
      </div>
      
      <TelemetryMessages />
    </div>
  </div>
</template>

<script setup lang="ts">
import ConnectionStatus from './ConnectionStatus.vue';
import KafkaStatus from './KafkaStatus.vue';
import TelemetryMessages from './TelemetryMessages.vue';
</script>

<style scoped>
.rocket-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 20px;
}

.rocket-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.status-panels {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.rocket-svg {
  width: 200px;
  height: 400px;
  max-width: 50vw;
  max-height: 70vh;
}

.flames {
  animation-fill-mode: both;
}

.main-flame {
  animation: flicker-main 0.8s ease-in-out infinite alternate;
}

.side-flame {
  animation: flicker-side 0.6s ease-in-out infinite alternate;
}

.left-flame {
  animation-delay: 0.1s;
}

.right-flame {
  animation-delay: 0.3s;
}

@keyframes flicker-main {
  0% {
    opacity: 0.8;
    transform: scaleY(1);
  }
  50% {
    opacity: 1;
    transform: scaleY(1.15);
  }
  100% {
    opacity: 0.9;
    transform: scaleY(0.95);
  }
}

@keyframes flicker-side {
  0% {
    opacity: 0.6;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.7;
    transform: scale(0.9);
  }
}

@media (max-width: 768px) {
  .rocket-svg {
    width: 150px;
    height: 300px;
  }
}

@media (max-width: 480px) {
  .rocket-svg {
    width: 120px;
    height: 240px;
  }
  
  .rocket-content {
    gap: 16px;
  }
  
  .status-panels {
    flex-direction: column;
    gap: 12px;
  }
}
</style>