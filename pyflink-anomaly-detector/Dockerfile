FROM python:3.9-slim

# Install Java (required for PyFlink)
RUN apt-get update && \
    apt-get install -y openjdk-11-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Set Java environment
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the anomaly detection job
COPY anomaly_detector.py .
COPY entrypoint.sh .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Set environment variables
ENV KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:9092
ENV PYTHONUNBUFFERED=1

# Run the job
ENTRYPOINT ["./entrypoint.sh"]