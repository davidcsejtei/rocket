# PRD - Iteration 7: Enhanced System Alerts and Dynamic Rocket Visualization

## Overview
Enhance the rocket telemetry system with improved alert prioritization, status-enhanced telemetry display, and dynamic rocket visualization that reflects the current mission phase.

## Features

### 1. Priority-Based System Alerts
**Requirement**: System alerts display only the top 3 most recent alerts, ordered by severity (highest severity first).

**Implementation Details**:
- Modify `AnomalyAlerts` component to show maximum 3 alerts
- Sort alerts by severity priority: `critical` > `high` > `medium` > `low`
- When multiple alerts have same severity, order by timestamp (newest first)
- Add severity-based visual indicators (colors, icons)

**Severity Priority Order**:
1. `critical` - Red background, urgent styling
2. `high` - Orange background, high attention styling
3. `medium` - Yellow background, moderate attention styling
4. `low` - Blue background, low attention styling

### 2. Enhanced Live Telemetry Display
**Requirement**: Extend telemetry boxes with status information to provide better context.

**Implementation Details**:
- Add current rocket status to `TelemetryMessages` component
- Display status prominently with color-coded indicators
- Include status-specific information:
  - `prelaunch`: Countdown timer, systems check
  - `ignition`: Engine startup indicators
  - `liftoff`: Launch confirmation, initial acceleration
  - `ascent`: Flight trajectory, altitude gain rate
  - `coasting`: Passive flight indicators
  - `descent`: Re-entry status, deceleration
  - `landed`: Landing confirmation, mission completion
  - `abort`: Emergency status, safety protocols

**Status Indicators**:
- Color-coded status badges
- Status-specific icons
- Brief status description
- Status duration timer

### 3. Dynamic Rocket Visualization
**Requirement**: Modify the rocket image to represent the current status/phase of the rocket mission.

**Implementation Details**:
- Update `RocketDisplay` component with status-aware visualization
- Implement different visual states for each rocket status:

**Visual States**:
- `prelaunch`: Static rocket on launchpad, no flames
- `ignition`: Small engine glow, startup effects
- `liftoff`: Full thrust flames, bright engine glow
- `ascent`: Active flight flames, trajectory indicators
- `coasting`: Reduced flames, momentum indicators
- `descent`: Reversed orientation, re-entry effects
- `landed`: No flames, landed configuration
- `abort`: Emergency indicators, warning visuals

**Visual Elements**:
- Dynamic flame animations based on status
- Rocket orientation changes for different phases
- Color changes to indicate mission health
- Status-specific particle effects
- Visual feedback for critical events

### 4. Status Tracking Enhancement
**Requirement**: Track and display current rocket status across all components.

**Implementation Details**:
- Enhance `websocketService` to track current rocket status
- Provide reactive status updates to all components
- Implement status change notifications
- Add status history tracking

## Technical Requirements

### Frontend Changes
1. **AnomalyAlerts.vue**:
   - Implement severity-based sorting
   - Limit display to top 3 alerts
   - Add severity-based styling

2. **TelemetryMessages.vue**:
   - Add status display section
   - Implement status-based indicators
   - Show status-specific information

3. **RocketDisplay.vue**:
   - Implement dynamic SVG modifications
   - Add status-based visual states
   - Create smooth transitions between states

4. **WebSocketService**:
   - Track current rocket status
   - Provide status change detection
   - Implement status-based filtering

### Styling Requirements
- Status-specific color schemes
- Smooth animations between visual states
- Responsive design for all screen sizes
- Accessibility compliance for color-blind users

## Success Criteria
1. ✅ System alerts show only top 3 alerts ordered by severity
2. ✅ Telemetry display includes comprehensive status information
3. ✅ Rocket visualization dynamically reflects mission status
4. ✅ All visual changes are smooth and performant
5. ✅ Status information is accurate and real-time
6. ✅ Interface remains responsive and user-friendly

## Technical Notes
- Maintain existing performance standards
- Ensure backward compatibility with existing data
- Implement proper error handling for status transitions
- Use TypeScript for type safety
- Follow existing code patterns and conventions

## Definition of Done
- [ ] Alert system displays max 3 alerts sorted by severity
- [ ] Telemetry boxes show detailed status information  
- [ ] Rocket SVG changes based on mission status
- [ ] Status transitions are smooth and intuitive
- [ ] All components are responsive and accessible
- [ ] Code is tested and follows project standards
- [ ] Documentation is updated for new features