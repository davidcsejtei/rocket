# PRD - Iteration 6: Data Management Controls

## Overview
Add administrative controls to reset and clear telemetry data and anomaly alerts, providing operators with the ability to clean up Kafka topics and start fresh monitoring sessions.

## Success Criteria
- [ ] Reset telemetry data button clears all telemetry messages from UI and Kafka topic
- [ ] Reset anomalies button clears all anomaly alerts from UI and Kafka topic  
- [ ] Buttons provide confirmation dialogs to prevent accidental data loss
- [ ] Operations execute successfully with proper feedback to users
- [ ] Kafka topics are properly cleared without affecting system stability
- [ ] UI state resets appropriately after clearing operations

## Functional Requirements

### FR-1: Reset Telemetry Data
- **Button Location**: Mission Controls panel in main dashboard
- **Functionality**: 
  - Clears all telemetry messages from `rocket-telemetry` Kafka topic
  - Removes all telemetry data from UI display
  - Resets telemetry message counter
  - Clears celebration state (rockets can celebrate again)

### FR-2: Reset Anomalies
- **Button Location**: Mission Controls panel in main dashboard  
- **Functionality**:
  - Clears all anomaly alerts from `rocket-anomalies` Kafka topic
  - Removes all anomaly data from UI display
  - Resets anomaly counters and status
  - Clears anomaly history and recent alerts

### FR-3: Confirmation Dialogs
- **Pre-execution confirmations** for both operations:
  - Warning message about data loss
  - Clear explanation of what will be deleted
  - Confirm/Cancel options with distinct styling
  - Prevention of accidental clicks

### FR-4: User Feedback
- **Loading states** during operations
- **Success messages** when operations complete
- **Error handling** with specific error messages
- **Progress indicators** for long-running operations

### FR-5: Administrative Access
- **Visible to all users** (no special permissions required)
- **Clear labeling** to indicate administrative nature
- **Grouped in dedicated Mission Controls section**
- **Distinctive styling** to separate from operational controls

## Technical Requirements

### TR-1: Frontend Implementation
- Create Mission Controls component with reset buttons
- Implement confirmation dialogs with modal overlays
- Add loading states and progress indicators
- Integrate with existing websocket service

### TR-2: Backend API Endpoints
- **POST /api/admin/reset-telemetry**: Clear telemetry Kafka topic
- **POST /api/admin/reset-anomalies**: Clear anomaly Kafka topic
- **GET /api/admin/status**: Get current data counts for confirmation
- Proper error handling and response status codes

### TR-3: Kafka Topic Management
- Use Kafka Admin Client to delete and recreate topics
- Ensure topic configuration matches original settings
- Handle concurrent operations gracefully
- Maintain topic partition and replication settings

### TR-4: State Management
- Clear frontend data stores and reactive state
- Reset websocket service internal counters
- Update UI components to reflect empty state
- Trigger re-rendering of data components

## User Stories

### US-1: Clean Slate Operations
**As an** operator monitoring rocket telemetry  
**I want** to clear all telemetry data from the system  
**So that** I can start monitoring a new mission with a clean interface

### US-2: Anomaly Management
**As an** operator managing system alerts  
**I want** to reset all anomaly data  
**So that** I can clear resolved issues and focus on new problems

### US-3: Safe Data Operations
**As a** user performing data cleanup  
**I want** to see confirmation dialogs before data deletion  
**So that** I don't accidentally lose important information

### US-4: Operation Feedback
**As a** user executing reset operations  
**I want** to see clear feedback about operation status  
**So that** I know whether the operation succeeded or failed

## Acceptance Criteria

### AC-1: Reset Telemetry Data
- **Given** telemetry data exists in the system
- **When** user clicks "Reset Telemetry Data" and confirms
- **Then** all telemetry messages are cleared from UI and Kafka topic

### AC-2: Reset Anomalies
- **Given** anomaly alerts exist in the system  
- **When** user clicks "Reset Anomalies" and confirms
- **Then** all anomaly data is cleared from UI and Kafka topic

### AC-3: Confirmation Required
- **Given** user clicks any reset button
- **When** the confirmation dialog appears
- **Then** user must explicitly confirm before data is deleted

### AC-4: Loading States
- **Given** user confirms a reset operation
- **When** the operation is in progress
- **Then** appropriate loading indicators and disabled states are shown

### AC-5: Success Feedback
- **Given** reset operation completes successfully
- **When** operation finishes
- **Then** success message is displayed and UI reflects empty state

### AC-6: Error Handling
- **Given** reset operation fails
- **When** error occurs
- **Then** specific error message is displayed and data remains unchanged

### AC-7: UI State Reset
- **Given** data has been cleared
- **When** viewing data components
- **Then** components show appropriate empty states and counters are reset

## Implementation Plan

### Phase 1: Backend API
1. Create admin controller with reset endpoints
2. Implement Kafka topic clearing functionality
3. Add proper error handling and logging
4. Test topic recreation and configuration

### Phase 2: Frontend Components
1. Create MissionControls.vue component
2. Implement confirmation dialog component
3. Add reset buttons with proper styling
4. Integrate with websocket service

### Phase 3: State Management
1. Add reset methods to websocket service
2. Update data clearing logic
3. Implement UI state reset functionality
4. Add loading and feedback states

### Phase 4: Integration & Testing
1. Connect frontend to backend APIs
2. Test end-to-end reset functionality
3. Verify Kafka topic management
4. Validate UI state consistency

## Technical Implementation Details

### Backend Endpoints

#### Reset Telemetry Data
```typescript
POST /api/admin/reset-telemetry
Response: {
  success: boolean;
  message: string;
  clearedMessages?: number;
}
```

#### Reset Anomalies
```typescript
POST /api/admin/reset-anomalies  
Response: {
  success: boolean;
  message: string;
  clearedAnomalies?: number;
}
```

#### Admin Status
```typescript
GET /api/admin/status
Response: {
  telemetryCount: number;
  anomalyCount: number;
  topics: {
    telemetry: { exists: boolean; partitions: number; };
    anomalies: { exists: boolean; partitions: number; };
  }
}
```

### Frontend Components

#### MissionControls.vue
- Reset telemetry data button
- Reset anomalies button  
- Loading states and feedback
- Integration with confirmation dialogs

#### ConfirmationDialog.vue
- Reusable confirmation modal
- Customizable warning messages
- Confirm/Cancel actions
- Keyboard navigation support

### Kafka Operations
- **Topic Deletion**: Use AdminClient.deleteTopics()
- **Topic Recreation**: Use AdminClient.createTopics() with original config
- **Configuration Preservation**: Maintain partitions, replication factor
- **Error Recovery**: Handle partial failures gracefully

## Security Considerations

### Data Protection
- Confirmation dialogs prevent accidental deletion
- Operations are logged for audit trails
- No sensitive data exposure in error messages

### Access Control
- Currently no authentication required (public access)
- Future: Could be restricted to admin users
- Rate limiting could be applied to prevent abuse

## Performance Considerations

### Kafka Operations
- Topic deletion/creation may take several seconds
- UI should show appropriate loading states
- Operations should be asynchronous with proper feedback

### Frontend Updates  
- Efficient state clearing without memory leaks
- Proper component unmounting and remounting
- Minimal UI flickering during state transitions

## Success Metrics
- Reset operations complete successfully within 10 seconds
- UI accurately reflects cleared state immediately after operation
- Zero data corruption or system instability after resets
- User confirmation prevents >90% of accidental deletions
- Clear success/error feedback provided for all operations

## Dependencies
- Kafka Admin Client functionality
- Existing websocket service architecture
- Current telemetry and anomaly data structures
- Backend API infrastructure

## Future Enhancements (Out of Scope)
- Selective data deletion (date ranges, rocket IDs)
- Data export before deletion
- Automated cleanup schedules
- Backup and restore functionality
- Fine-grained access control
- Bulk operations across multiple topics