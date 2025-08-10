import json
import os
import uuid
import time
from datetime import datetime
from typing import Dict, Any, Optional, List

from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import EnvironmentSettings, TableEnvironment


class AnomalyDetector:
    def __init__(self):
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
    
    def detect_anomalies(self, telemetry_json: str) -> Optional[str]:
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
        anomalies = []
        
        for param, rule in self.anomaly_rules.items():
            if param not in telemetry:
                continue
                
            value = telemetry[param]
            anomaly = self._check_parameter_anomaly(param, value, rule, telemetry)
            
            if anomaly:
                anomalies.append(anomaly)
        
        if anomalies:
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
        if 'exact' in rule:
            if value == rule['exact']:
                return {
                    'parameter': param,
                    'value': value,
                    'type': rule['type'],
                    'expected_range': f"!= {rule['exact']}",
                    'description': f"{param} anomaly: {rule['type'].replace('_', ' ').title()}"
                }
        
        elif 'min' in rule:
            if 'max' in rule:
                if rule['min'] <= value <= rule['max']:
                    return {
                        'parameter': param,
                        'value': value,
                        'type': rule['type'],
                        'expected_range': f"outside {rule['min']}-{rule['max']}",
                        'description': f"{param} anomaly: {rule['type'].replace('_', ' ').title()}"
                    }
            else:
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
        anomaly_type = anomaly['type']
        value = anomaly['value']
        
        if anomaly_type == 'engine_shutdown' or total_anomalies >= 3:
            return 'critical'
        
        if (anomaly_type == 'fuel_leak' and value > 150) or \
           (anomaly_type == 'thermal_anomaly' and value > 3700) or \
           (anomaly_type == 'guidance_failure' and value > 5.0):
            return 'high'
        
        if (anomaly_type == 'engine_underperformance' and value < 60) or \
           (anomaly_type in ['fuel_leak', 'sensor_malfunction']):
            return 'medium'
        
        return 'low'


def create_table_environment():
    settings = EnvironmentSettings.new_instance().in_streaming_mode().build()
    table_env = TableEnvironment.create(settings)
    
    jar_file = '/app/lib/flink-sql-connector-kafka-1.17.1.jar'
    if os.path.exists(jar_file):
        table_env.get_config().get_configuration().set_string(
            "pipeline.jars", f"file://{jar_file}"
        )
        print(f"Added JAR file: {jar_file}")
    else:
        print(f"Warning: JAR file not found at {jar_file}")
    
    return table_env


def main():
    kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    input_topic = 'rocket-telemetry'
    output_topic = 'rocket-anomalies'
    
    print("Starting Rocket Anomaly Detection Job...")
    print(f"Input topic: {input_topic}")
    print(f"Output topic: {output_topic}")
    print(f"Kafka servers: {kafka_servers}")
    
    detector = AnomalyDetector()
    
    try:
        table_env = create_table_environment()
        
        source_ddl = f"""
            CREATE TABLE telemetry_source (
                data STRING
            ) WITH (
                'connector' = 'kafka',
                'topic' = '{input_topic}',
                'properties.bootstrap.servers' = '{kafka_servers}',
                'properties.group.id' = 'anomaly-detector',
                'format' = 'raw',
                'scan.startup.mode' = 'latest-offset'
            )
        """
        
        sink_ddl = f"""
            CREATE TABLE anomaly_sink (
                anomaly STRING
            ) WITH (
                'connector' = 'kafka',
                'topic' = '{output_topic}',
                'properties.bootstrap.servers' = '{kafka_servers}',
                'format' = 'raw'
            )
        """
        
        print("Creating Kafka source table...")
        table_env.execute_sql(source_ddl)
        print("Creating Kafka sink table...")
        table_env.execute_sql(sink_ddl)
        
        print("Setting up anomaly detection function...")
        table_env.create_temporary_system_function(
            "detect_anomalies",
            lambda x: detector.detect_anomalies(x) if x else None
        )
        
        query = """
            INSERT INTO anomaly_sink
            SELECT detect_anomalies(data) as anomaly
            FROM telemetry_source
            WHERE detect_anomalies(data) IS NOT NULL
        """
        
        print("Executing anomaly detection pipeline...")
        result = table_env.execute_sql(query)
        
        print("Pipeline started successfully. Processing telemetry data...")
        print("Press Ctrl+C to stop the job...")
        
        try:
            result.wait()
        except KeyboardInterrupt:
            print("Received interrupt signal. Stopping job...")
        
    except Exception as e:
        print(f"Error with Kafka setup: {e}")
        print("Running in test mode with sample data...")
        
        test_data = [
            '{"timestamp":"2025-08-10T14:23:45.123Z","rocketId":"Falcon-9-001","missionTime":45.2,"stage":1,"status":"ascent","altitude":12540.7,"velocity":1847.3,"acceleration":18.45,"machNumber":5.38,"pitch":67.2,"yaw":-1.8,"roll":0.4,"fuelRemaining":78.3,"fuelMass":321630,"thrust":0,"burnRate":2600.0,"engineEfficiency":50.0,"engineTemp":3500,"airDensity":0.524391,"dragForce":47892,"totalMass":343830,"thrustToWeight":2.26,"apogee":186420,"sensorNoise":2.0,"guidanceError":3.0,"fuelLeakRate":100.0,"activeAnomalies":3}',
            '{"timestamp":"2025-08-10T14:23:50.123Z","rocketId":"Falcon-9-001","missionTime":50.2,"stage":1,"status":"ascent","altitude":15000.0,"velocity":2000.0,"acceleration":20.0,"machNumber":6.0,"pitch":70.0,"yaw":0.0,"roll":0.0,"fuelRemaining":75.0,"fuelMass":300000,"thrust":7500000,"burnRate":2500.0,"engineEfficiency":98.0,"engineTemp":3200,"airDensity":0.4,"dragForce":50000,"totalMass":350000,"thrustToWeight":2.1,"apogee":200000,"sensorNoise":0.5,"guidanceError":0.1,"fuelLeakRate":0.0,"activeAnomalies":0}'
        ]
        
        print("Processing test telemetry data...")
        for i, data in enumerate(test_data):
            print(f"\n=== Processing test message {i+1} ===")
            print(f"Input: {data[:100]}...")
            
            result = detector.detect_anomalies(data)
            if result:
                anomaly = json.loads(result)
                print(f"🚨 ANOMALY DETECTED:")
                print(f"   Type: {anomaly['anomalyType']}")
                print(f"   Severity: {anomaly['severity']}")
                print(f"   Parameter: {anomaly['affectedParameter']}")
                print(f"   Value: {anomaly['currentValue']}")
                print(f"   Expected: {anomaly['expectedRange']}")
                print(f"   Description: {anomaly['description']}")
                print(f"   Total Anomalies: {anomaly['totalAnomalies']}")
            else:
                print("✅ No anomalies detected")
            
            time.sleep(1)
        
        print("\n🔄 Running continuous monitoring loop...")
        print("Simulating real-time anomaly detection...")
        
        while True:
            try:
                for data in test_data:
                    result = detector.detect_anomalies(data)
                    if result:
                        anomaly = json.loads(result)
                        print(f"🚨 {datetime.now().strftime('%H:%M:%S')} - {anomaly['anomalyType'].upper()} ({anomaly['severity']})")
                    time.sleep(5)
            except KeyboardInterrupt:
                print("\nReceived interrupt signal. Exiting...")
                break


if __name__ == '__main__':
    main()