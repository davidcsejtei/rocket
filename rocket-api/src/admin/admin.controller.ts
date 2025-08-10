import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';

export interface AdminResponse {
  success: boolean;
  message: string;
  clearedMessages?: number;
  clearedAnomalies?: number;
}

export interface AdminStatus {
  telemetryCount: number;
  anomalyCount: number;
  topics: {
    telemetry: { exists: boolean; partitions: number; };
    anomalies: { exists: boolean; partitions: number; };
  };
}

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('reset-telemetry')
  @HttpCode(HttpStatus.OK)
  async resetTelemetryData(): Promise<AdminResponse> {
    try {
      const result = await this.adminService.resetTelemetryTopic();
      return {
        success: true,
        message: 'Telemetry data reset successfully',
        clearedMessages: result.clearedMessages,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to reset telemetry data: ${error.message}`,
      };
    }
  }

  @Post('reset-anomalies')
  @HttpCode(HttpStatus.OK)
  async resetAnomalies(): Promise<AdminResponse> {
    try {
      const result = await this.adminService.resetAnomaliesTopic();
      return {
        success: true,
        message: 'Anomaly data reset successfully',
        clearedAnomalies: result.clearedAnomalies,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to reset anomaly data: ${error.message}`,
      };
    }
  }

  @Get('status')
  async getAdminStatus(): Promise<AdminStatus> {
    try {
      return await this.adminService.getAdminStatus();
    } catch (error) {
      return {
        telemetryCount: 0,
        anomalyCount: 0,
        topics: {
          telemetry: { exists: false, partitions: 0 },
          anomalies: { exists: false, partitions: 0 },
        },
      };
    }
  }
}