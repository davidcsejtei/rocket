<template>
  <div class="rocket-container">
    <!-- Celebration Popup -->
    <CelebrationPopup
      v-if="websocketService.celebrationData.value"
      :visible="websocketService.celebrationData.value.visible"
      :final-altitude="websocketService.celebrationData.value.finalAltitude"
      :rocket-id="websocketService.celebrationData.value.rocketId"
      :mission-time="websocketService.celebrationData.value.missionTime"
      @dismiss="websocketService.dismissCelebration()"
    />
    <div class="rocket-content">
      <!-- Emergency Shutdown Component -->
      <EmergencyShutdown />

      <svg
        class="rocket-svg"
        :class="rocketClasses"
        viewBox="0 0 100 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Rocket body -->
        <ellipse
          cx="50"
          cy="50"
          rx="12"
          ry="30"
          class="rocket-body"
          :fill="currentStatus === 'abort' ? '#ff6b6b' : '#e0e0e0'"
        />

        <!-- Rocket tip -->
        <polygon
          points="50,20 38,50 62,50"
          class="rocket-tip"
          :fill="currentStatus === 'abort' ? '#d32f2f' : '#ff6b6b'"
        />

        <!-- Rocket fins -->
        <polygon
          points="35,70 25,90 35,85"
          class="rocket-fin"
          :fill="currentStatus === 'abort' ? '#ff5722' : '#4ecdc4'"
        />
        <polygon
          points="65,70 75,90 65,85"
          class="rocket-fin"
          :fill="currentStatus === 'abort' ? '#ff5722' : '#4ecdc4'"
        />

        <!-- Rocket window -->
        <circle
          cx="50"
          cy="40"
          r="5"
          class="rocket-window"
          :fill="currentStatus === 'abort' ? '#ff9800' : '#87ceeb'"
        />

        <!-- Status indicator light -->
        <circle
          cx="50"
          cy="32"
          r="2"
          class="status-light"
          :fill="getStatusLightColor(currentStatus)"
        />

        <!-- Flame base -->
        <g
          class="flames"
          :style="{
            opacity: flameVisibility.opacity,
            transform: `scale(${flameVisibility.scale})`,
            transformOrigin: '50px 85px',
          }"
        >
          <!-- Main flame -->
          <ellipse
            cx="50"
            cy="85"
            rx="8"
            ry="15"
            :fill="getFlameGradient(currentStatus, 'main')"
            class="main-flame"
          />

          <!-- Left flame -->
          <ellipse
            cx="45"
            cy="88"
            rx="4"
            ry="12"
            :fill="getFlameGradient(currentStatus, 'side')"
            class="side-flame left-flame"
          />

          <!-- Right flame -->
          <ellipse
            cx="55"
            cy="88"
            rx="4"
            ry="12"
            :fill="getFlameGradient(currentStatus, 'side')"
            class="side-flame right-flame"
          />
        </g>

        <!-- Gradient definitions -->
        <defs>
          <!-- Prelaunch gradients (no flames) -->
          <linearGradient id="prelaunchmainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #9e9e9e; stop-opacity: 0" />
            <stop offset="100%" style="stop-color: #9e9e9e; stop-opacity: 0" />
          </linearGradient>
          <linearGradient id="prelaunchsideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #9e9e9e; stop-opacity: 0" />
            <stop offset="100%" style="stop-color: #9e9e9e; stop-opacity: 0" />
          </linearGradient>

          <!-- Ignition gradients (small startup flames) -->
          <linearGradient id="ignitionmainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ffeb3b; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #ff9800; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #f44336; stop-opacity: 1" />
          </linearGradient>
          <linearGradient id="ignitionsideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ffc107; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #ff5722; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #d32f2f; stop-opacity: 1" />
          </linearGradient>

          <!-- Liftoff gradients (full thrust) -->
          <linearGradient id="liftoffmainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ffffff; stop-opacity: 1" />
            <stop offset="30%" style="stop-color: #ffeb3b; stop-opacity: 1" />
            <stop offset="70%" style="stop-color: #ff9800; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #f44336; stop-opacity: 1" />
          </linearGradient>
          <linearGradient id="liftoffsideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ffeb3b; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #ff5722; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #d32f2f; stop-opacity: 1" />
          </linearGradient>

          <!-- Ascent gradients (steady flight) -->
          <linearGradient id="ascentmainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ffeb3b; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #ff9800; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #f44336; stop-opacity: 1" />
          </linearGradient>
          <linearGradient id="ascentsideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ffc107; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #ff5722; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #d32f2f; stop-opacity: 1" />
          </linearGradient>

          <!-- Coasting gradients (reduced flames) -->
          <linearGradient id="coastingmainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ffeb3b; stop-opacity: 0.7" />
            <stop offset="50%" style="stop-color: #ff9800; stop-opacity: 0.7" />
            <stop offset="100%" style="stop-color: #f44336; stop-opacity: 0.7" />
          </linearGradient>
          <linearGradient id="coastingsideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ffc107; stop-opacity: 0.7" />
            <stop offset="50%" style="stop-color: #ff5722; stop-opacity: 0.7" />
            <stop offset="100%" style="stop-color: #d32f2f; stop-opacity: 0.7" />
          </linearGradient>

          <!-- Descent gradients (re-entry effects) -->
          <linearGradient id="descentmainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #2196f3; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #673ab7; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #9c27b0; stop-opacity: 1" />
          </linearGradient>
          <linearGradient id="descentsideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #3f51b5; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #673ab7; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #9c27b0; stop-opacity: 1" />
          </linearGradient>

          <!-- Landed gradients (no flames) -->
          <linearGradient id="landedmainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #9e9e9e; stop-opacity: 0" />
            <stop offset="100%" style="stop-color: #9e9e9e; stop-opacity: 0" />
          </linearGradient>
          <linearGradient id="landedsideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #9e9e9e; stop-opacity: 0" />
            <stop offset="100%" style="stop-color: #9e9e9e; stop-opacity: 0" />
          </linearGradient>

          <!-- Abort gradients (emergency indicators) -->
          <linearGradient id="abortmainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ff1744; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #f44336; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #d32f2f; stop-opacity: 1" />
          </linearGradient>
          <linearGradient id="abortsideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ff5722; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #d32f2f; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #b71c1c; stop-opacity: 1" />
          </linearGradient>
        </defs>
      </svg>

      <div class="status-panels">
        <ConnectionStatus />
        <KafkaStatus />
        <AnomalyAlerts />
        <MissionControls />
      </div>

      <div class="data-panels">
        <TelemetryMessages />
        <AnomalyHistory />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ConnectionStatus from './ConnectionStatus.vue'
import KafkaStatus from './KafkaStatus.vue'
import TelemetryMessages from './TelemetryMessages.vue'
import AnomalyAlerts from './AnomalyAlerts.vue'
import AnomalyHistory from './AnomalyHistory.vue'
import CelebrationPopup from './CelebrationPopup.vue'
import MissionControls from './MissionControls.vue'
import EmergencyShutdown from './EmergencyShutdown.vue'
import { websocketService } from '@/services/websocket.service'
import { computed } from 'vue'

const currentStatus = computed(() => websocketService.currentRocketStatus.value)

const rocketClasses = computed(() => ({
  'rocket-prelaunch': currentStatus.value === 'prelaunch',
  'rocket-ignition': currentStatus.value === 'ignition',
  'rocket-liftoff': currentStatus.value === 'liftoff',
  'rocket-ascent': currentStatus.value === 'ascent',
  'rocket-coasting': currentStatus.value === 'coasting',
  'rocket-descent': currentStatus.value === 'descent',
  'rocket-landed': currentStatus.value === 'landed',
  'rocket-abort': currentStatus.value === 'abort',
}))

const flameVisibility = computed(() => {
  const status = currentStatus.value
  return (
    {
      prelaunch: { opacity: 0, scale: 0 },
      ignition: { opacity: 0.4, scale: 0.6 },
      liftoff: { opacity: 1, scale: 1.2 },
      ascent: { opacity: 1, scale: 1 },
      coasting: { opacity: 0.3, scale: 0.7 },
      descent: { opacity: 0.6, scale: 0.8 },
      landed: { opacity: 0, scale: 0 },
      abort: { opacity: 0.8, scale: 1.1 },
    }[status] || { opacity: 0, scale: 0 }
  )
})

const getStatusLightColor = (status: string) => {
  const colors = {
    prelaunch: '#9e9e9e',
    ignition: '#ffc107',
    liftoff: '#4caf50',
    ascent: '#2196f3',
    coasting: '#ff9800',
    descent: '#673ab7',
    landed: '#4caf50',
    abort: '#f44336',
  }
  return colors[status as keyof typeof colors] || '#9e9e9e'
}

const getFlameGradient = (status: string, type: 'main' | 'side') => {
  const gradientId = `${status}${type}Gradient`
  return `url(#${gradientId})`
}
</script>

<style scoped>
.rocket-container {
  justify-content: center;
  align-items: flex-start;
  display: flex;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 10px;
  overflow-y: auto;
  overflow-x: hidden;
}

.rocket-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding-top: 20px;
}

.status-panels {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.data-panels {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  margin-bottom: 20px;
}

.rocket-svg {
  width: 180px;
  height: 180px;
  max-width: 25vw;
  max-height: 40vh;
  flex-shrink: 0;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Status-specific rocket transformations */
.rocket-prelaunch {
  transform: translateY(0) rotate(0deg);
}

.rocket-ignition {
  transform: translateY(0) rotate(0deg);
  filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.3));
}

.rocket-liftoff {
  transform: translateY(-5px) rotate(0deg);
  filter: drop-shadow(0 0 15px rgba(255, 235, 59, 0.5));
}

.rocket-ascent {
  transform: translateY(-10px) rotate(0deg);
  filter: drop-shadow(0 0 12px rgba(255, 152, 0, 0.4));
}

.rocket-coasting {
  transform: translateY(-8px) rotate(2deg);
  filter: drop-shadow(0 0 8px rgba(255, 152, 0, 0.2));
}

.rocket-descent {
  transform: translateY(0) rotate(180deg);
  filter: drop-shadow(0 0 12px rgba(103, 58, 183, 0.4));
}

.rocket-landed {
  transform: translateY(5px) rotate(0deg);
  filter: drop-shadow(0 0 5px rgba(76, 175, 80, 0.3));
}

.rocket-abort {
  animation: rocket-shake 0.5s ease-in-out infinite;
  filter: drop-shadow(0 0 15px rgba(244, 67, 54, 0.6));
}

.flames {
  animation-fill-mode: both;
  transition: all 0.4s ease-in-out;
}

.main-flame {
  animation: flicker-main 0.8s ease-in-out infinite alternate;
  transition: all 0.4s ease-in-out;
}

.side-flame {
  animation: flicker-side 0.6s ease-in-out infinite alternate;
  transition: all 0.4s ease-in-out;
}

.left-flame {
  animation-delay: 0.1s;
}

.right-flame {
  animation-delay: 0.3s;
}

/* Status-specific flame animations */
.rocket-liftoff .main-flame {
  animation: flicker-intense 0.4s ease-in-out infinite alternate;
}

.rocket-liftoff .side-flame {
  animation: flicker-intense-side 0.3s ease-in-out infinite alternate;
}

.rocket-ignition .main-flame {
  animation: flicker-startup 1.2s ease-in-out infinite alternate;
}

.rocket-ignition .side-flame {
  animation: flicker-startup-side 1s ease-in-out infinite alternate;
}

.rocket-abort .main-flame {
  animation: flicker-emergency 0.2s ease-in-out infinite;
}

.rocket-abort .side-flame {
  animation: flicker-emergency 0.15s ease-in-out infinite;
}

/* Rocket component transitions */
.rocket-body,
.rocket-tip,
.rocket-fin,
.rocket-window,
.status-light {
  transition: all 0.6s ease-in-out;
}

/* Status light animation */
.status-light {
  animation: status-pulse 2s ease-in-out infinite;
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

@keyframes flicker-intense {
  0% {
    opacity: 0.9;
    transform: scaleY(1.1);
  }
  25% {
    opacity: 1;
    transform: scaleY(1.3);
  }
  75% {
    opacity: 0.95;
    transform: scaleY(1.2);
  }
  100% {
    opacity: 1;
    transform: scaleY(1.05);
  }
}

@keyframes flicker-intense-side {
  0% {
    opacity: 0.8;
    transform: scale(0.9);
  }
  25% {
    opacity: 1;
    transform: scale(1.2);
  }
  75% {
    opacity: 0.9;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.95;
    transform: scale(1);
  }
}

@keyframes flicker-startup {
  0% {
    opacity: 0.3;
    transform: scaleY(0.5);
  }
  50% {
    opacity: 0.7;
    transform: scaleY(0.8);
  }
  100% {
    opacity: 0.5;
    transform: scaleY(0.6);
  }
}

@keyframes flicker-startup-side {
  0% {
    opacity: 0.2;
    transform: scale(0.4);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.7);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.5);
  }
}

@keyframes flicker-emergency {
  0% {
    opacity: 1;
    transform: scaleY(1.2);
  }
  50% {
    opacity: 0.7;
    transform: scaleY(0.8);
  }
  100% {
    opacity: 1;
    transform: scaleY(1.2);
  }
}

@keyframes rocket-shake {
  0%,
  100% {
    transform: translateX(0) translateY(-2px);
  }
  25% {
    transform: translateX(-2px) translateY(0);
  }
  75% {
    transform: translateX(2px) translateY(-1px);
  }
}

@keyframes status-pulse {
  0%,
  100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@media (max-width: 768px) {
  .rocket-container {
    padding: 8px;
  }

  .rocket-content {
    padding-top: 10px;
    gap: 12px;
  }

  .rocket-svg {
    width: 120px;
    height: 240px;
    max-width: 30vw;
    max-height: 25vh;
  }

  .status-panels,
  .data-panels {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .rocket-container {
    padding: 5px;
  }

  .rocket-content {
    padding-top: 5px;
    gap: 8px;
  }

  .rocket-svg {
    width: 100px;
    height: 200px;
  }

  .status-panels,
  .data-panels {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
