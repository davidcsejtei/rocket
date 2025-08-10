import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List

from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.connectors.kafka import FlinkKafkaConsumer, FlinkKafkaProducer
from pyflink.common.serialization import SimpleStringSchema
from pyflink.common.typeinfo import Types
from pyflink.datastream.functions import MapFunction


class AnomalyDetector(MapFunction):
    """Detects anomalies in rocket telemetry data based on predefined rules."""
    
    def __init__(self):
        # Anomaly detection thresholds
        self.anomaly_rules = {
            'engineEfficiency': {'min': 40.0, 'max': 80.0, 'type': 'engine_underperformance'},
            'burnRate': {'min': 2550.0, 'max': 2700.0, 'type': 'fuel_leak'},
            'sensorNoise': {'min': 1.5, 'max': 3.0, 'type': 'sensor_malfunction'},
            'guidanceError': {'min': 2.0, 'max': 8.0, 'type': 'guidance_failure'},
            'fuelLeakRate': {'min': 50.0, 'max': 200.0, 'type': 'fuel_leak'},
            'engineTemp': {'min': 3400, 'max': 4000, 'type': 'thermal_anomaly'},
            'thrust': {'exact': 0, 'type': 'engine_shutdown'},
            'activeAnomalies': {'min': 1, 'type': 'multiple_anomalies'}
        }
    
    def map(self, telemetry_json: str) -> Optional[str]:
        """Process telemetry message and detect anomalies."""
        try:
            telemetry = json.loads(telemetry_json)
            detected_anomalies = self._detect_anomalies(telemetry)
            
            if detected_anomalies:
                return json.dumps(detected_anomalies)
            return None
            
        except Exception as e:
            print(f"Error processing telemetry: {e}")
            return None
    
    def _detect_anomalies(self, telemetry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Detect anomalies in telemetry data."""
        anomalies = []
        
        for param, rule in self.anomaly_rules.items():
            if param not in telemetry:
                continue
                
            value = telemetry[param]
            anomaly = self._check_parameter_anomaly(param, value, rule, telemetry)
            
            if anomaly:
                anomalies.append(anomaly)
        
        if anomalies:
            # Create primary anomaly alert (use first detected for simplicity)
            primary_anomaly = anomalies[0]
            return {
                'alertId': str(uuid.uuid4()),
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'rocketId': telemetry.get('rocketId', 'unknown'),
                'missionTime': telemetry.get('missionTime', 0),
                'anomalyType': primary_anomaly['type'],
                'severity': self._calculate_severity(primary_anomaly, len(anomalies)),
                'affectedParameter': primary_anomaly['parameter'],
                'currentValue': primary_anomaly['value'],
                'expectedRange': primary_anomaly['expected_range'],
                'description': primary_anomaly['description'],
                'originalTelemetry': telemetry,
                'totalAnomalies': len(anomalies)
            }
        
        return None
    
    def _check_parameter_anomaly(self, param: str, value: float, rule: Dict[str, Any], telemetry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check if a parameter value indicates an anomaly."""
        
        # Handle exact value checks (like thrust = 0)
        if 'exact' in rule:
            if value == rule['exact']:
                return {
                    'parameter': param,
                    'value': value,
                    'type': rule['type'],
                    'expected_range': f"!= {rule['exact']}",
                    'description': f"{param} anomaly: {rule['type'].replace('_', ' ').title()}"
                }
        
        # Handle range checks
        elif 'min' in rule:
            if 'max' in rule:
                # Range check (min-max)
                if rule['min'] <= value <= rule['max']:
                    return {
                        'parameter': param,
                        'value': value,
                        'type': rule['type'],
                        'expected_range': f"outside {rule['min']}-{rule['max']}",
                        'description': f"{param} anomaly: {rule['type'].replace('_', ' ').title()}"
                    }
            else:
                # Minimum threshold check
                if value >= rule['min']:
                    return {
                        'parameter': param,
                        'value': value,
                        'type': rule['type'],
                        'expected_range': f"< {rule['min']}",
                        'description': f"{param} anomaly: {rule['type'].replace('_', ' ').title()}"
                    }
        
        return None
    
    def _calculate_severity(self, anomaly: Dict[str, Any], total_anomalies: int) -> str:
        """Calculate anomaly severity based on type and count."""
        anomaly_type = anomaly['type']
        value = anomaly['value']
        
        # Critical conditions
        if anomaly_type == 'engine_shutdown' or total_anomalies >= 3:
            return 'critical'
        
        # High severity conditions
        if (anomaly_type == 'fuel_leak' and value > 150) or \
           (anomaly_type == 'thermal_anomaly' and value > 3700) or \
           (anomaly_type == 'guidance_failure' and value > 5.0):
            return 'high'
        
        # Medium severity conditions
        if (anomaly_type == 'engine_underperformance' and value < 60) or \
           (anomaly_type in ['fuel_leak', 'sensor_malfunction']):
            return 'medium'
        
        # Default to low severity
        return 'low'


def main():
    """Main function to set up and run the Flink job."""
    
    # Environment setup
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(1)
    
    # Kafka configuration
    kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    input_topic = 'rocket-telemetry'
    output_topic = 'rocket-anomalies'
    
    # Create Kafka consumer
    kafka_consumer = FlinkKafkaConsumer(
        input_topic,
        SimpleStringSchema(),
        {
            'bootstrap.servers': kafka_servers,
            'group.id': 'anomaly-detector'
        }
    )
    
    # Create Kafka producer
    kafka_producer = FlinkKafkaProducer(
        output_topic,
        SimpleStringSchema(),
        {
            'bootstrap.servers': kafka_servers
        }
    )
    
    # Create data stream
    telemetry_stream = env.add_source(kafka_consumer)
    
    # Apply anomaly detection
    anomaly_stream = telemetry_stream.map(
        AnomalyDetector(),
        output_type=Types.STRING()
    ).filter(lambda x: x is not None)
    
    # Send anomalies to output topic
    anomaly_stream.add_sink(kafka_producer)
    
    # Execute the job
    print("Starting Rocket Anomaly Detection Job...")
    print(f"Input topic: {input_topic}")
    print(f"Output topic: {output_topic}")
    print(f"Kafka servers: {kafka_servers}")
    
    env.execute("Rocket Anomaly Detector")


if __name__ == '__main__':
    main()