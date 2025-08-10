FROM python:3.9-slim

# Install JDK and build tools (required for PyFlink)
RUN apt-get update && \
    apt-get install -y default-jdk wget build-essential && \
    rm -rf /var/lib/apt/lists/*

# Set Java environment
ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV JAVA_TOOL_OPTIONS="--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED"

# Set working directory
WORKDIR /app

# Create directory for JAR files
RUN mkdir -p /app/lib

# Download Kafka connector JAR files
RUN wget -O /app/lib/flink-sql-connector-kafka-1.17.1.jar \
    https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-kafka/1.17.1/flink-sql-connector-kafka-1.17.1.jar

# Download and install PyFlink manually
RUN pip install apache-flink==1.17.1

# Copy requirements and install remaining Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the anomaly detection job
COPY anomaly_detector.py .
COPY entrypoint.sh .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Set environment variables
ENV KAFKA_BOOTSTRAP_SERVERS=kafka:29092
ENV PYTHONUNBUFFERED=1

# Run the job
ENTRYPOINT ["./entrypoint.sh"]