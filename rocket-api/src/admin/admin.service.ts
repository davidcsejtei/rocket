import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Admin, KafkaMessage } from 'kafkajs';

interface ResetResult {
  clearedMessages?: number;
  clearedAnomalies?: number;
}

interface AdminStatus {
  telemetryCount: number;
  anomalyCount: number;
  topics: {
    telemetry: { exists: boolean; partitions: number; };
    anomalies: { exists: boolean; partitions: number; };
  };
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private kafka: Kafka;
  private admin: Admin;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'rocket-api-admin',
      brokers,
    });

    this.admin = this.kafka.admin();
  }

  async resetTelemetryTopic(): Promise<ResetResult> {
    const topicName = 'rocket-telemetry';
    this.logger.log(`Starting reset of ${topicName} topic`);

    try {
      await this.admin.connect();

      // Get current topic metadata
      const topicMetadata = await this.getTopicMetadata(topicName);
      
      if (topicMetadata.exists) {
        this.logger.log(`Deleting topic: ${topicName}`);
        await this.admin.deleteTopics({
          topics: [topicName],
          timeout: 30000,
        });

        // Wait for deletion to complete
        await this.waitForTopicDeletion(topicName);
      }

      // Recreate topic with same configuration
      this.logger.log(`Recreating topic: ${topicName}`);
      await this.admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: topicMetadata.partitions || 1,
          replicationFactor: 1,
          configEntries: [
            { name: 'cleanup.policy', value: 'delete' },
            { name: 'retention.ms', value: '604800000' }, // 7 days
          ],
        }],
        timeout: 30000,
      });

      this.logger.log(`Successfully reset ${topicName} topic`);
      return { clearedMessages: topicMetadata.messageCount || 0 };

    } catch (error) {
      this.logger.error(`Failed to reset ${topicName} topic:`, error);
      throw new Error(`Topic reset failed: ${error.message}`);
    } finally {
      await this.admin.disconnect();
    }
  }

  async resetAnomaliesTopic(): Promise<ResetResult> {
    const topicName = 'rocket-anomalies';
    this.logger.log(`Starting reset of ${topicName} topic`);

    try {
      await this.admin.connect();

      // Get current topic metadata
      const topicMetadata = await this.getTopicMetadata(topicName);
      
      if (topicMetadata.exists) {
        this.logger.log(`Deleting topic: ${topicName}`);
        await this.admin.deleteTopics({
          topics: [topicName],
          timeout: 30000,
        });

        // Wait for deletion to complete
        await this.waitForTopicDeletion(topicName);
      }

      // Recreate topic with same configuration
      this.logger.log(`Recreating topic: ${topicName}`);
      await this.admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: topicMetadata.partitions || 1,
          replicationFactor: 1,
          configEntries: [
            { name: 'cleanup.policy', value: 'delete' },
            { name: 'retention.ms', value: '604800000' }, // 7 days
          ],
        }],
        timeout: 30000,
      });

      this.logger.log(`Successfully reset ${topicName} topic`);
      return { clearedAnomalies: topicMetadata.messageCount || 0 };

    } catch (error) {
      this.logger.error(`Failed to reset ${topicName} topic:`, error);
      throw new Error(`Topic reset failed: ${error.message}`);
    } finally {
      await this.admin.disconnect();
    }
  }

  async getAdminStatus(): Promise<AdminStatus> {
    try {
      await this.admin.connect();

      const [telemetryMetadata, anomaliesMetadata] = await Promise.all([
        this.getTopicMetadata('rocket-telemetry'),
        this.getTopicMetadata('rocket-anomalies'),
      ]);

      return {
        telemetryCount: telemetryMetadata.messageCount || 0,
        anomalyCount: anomaliesMetadata.messageCount || 0,
        topics: {
          telemetry: {
            exists: telemetryMetadata.exists,
            partitions: telemetryMetadata.partitions || 0,
          },
          anomalies: {
            exists: anomaliesMetadata.exists,
            partitions: anomaliesMetadata.partitions || 0,
          },
        },
      };

    } catch (error) {
      this.logger.error('Failed to get admin status:', error);
      throw error;
    } finally {
      await this.admin.disconnect();
    }
  }

  private async getTopicMetadata(topicName: string): Promise<{
    exists: boolean;
    partitions?: number;
    messageCount?: number;
  }> {
    try {
      const topicMetadata = await this.admin.fetchTopicMetadata({
        topics: [topicName],
      });

      const topic = topicMetadata.topics.find(t => t.name === topicName);
      
      if (!topic || topic.partitions.length === 0) {
        return { exists: false };
      }

      // Estimate message count (this is approximate)
      const messageCount = await this.estimateMessageCount(topicName);

      return {
        exists: true,
        partitions: topic.partitions.length,
        messageCount,
      };

    } catch (error) {
      this.logger.warn(`Could not fetch metadata for topic ${topicName}:`, error);
      return { exists: false };
    }
  }

  private async estimateMessageCount(topicName: string): Promise<number> {
    try {
      // This is a simple estimation - in production you might want more accurate counting
      const consumer = this.kafka.consumer({ groupId: 'admin-counter-temp' });
      await consumer.connect();

      const partitions = await consumer.describeGroup();
      
      // For simplicity, we'll return 0 as accurate message counting requires more complex logic
      await consumer.disconnect();
      return 0;

    } catch (error) {
      this.logger.warn(`Could not estimate message count for ${topicName}:`, error);
      return 0;
    }
  }

  private async waitForTopicDeletion(topicName: string, maxWaitMs: number = 15000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const metadata = await this.getTopicMetadata(topicName);
        if (!metadata.exists) {
          this.logger.log(`Topic ${topicName} successfully deleted`);
          return;
        }
        
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        // Topic might not exist anymore, which is what we want
        this.logger.log(`Topic ${topicName} appears to be deleted`);
        return;
      }
    }
    
    this.logger.warn(`Timeout waiting for topic ${topicName} deletion`);
  }
}