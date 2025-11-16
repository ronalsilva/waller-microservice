import { Kafka, logLevel, Partitioners } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'wallet-microservice',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    retry: {
        initialRetryTime: 100,
        retries: 8,
        multiplier: 2,
    },
    logLevel: logLevel.INFO,
});

export const producer = kafka.producer({
    allowAutoTopicCreation: true,
    createPartitioner: Partitioners.LegacyPartitioner,
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
});

export const consumer = kafka.consumer({ 
    groupId: 'wallet-microservice-group',
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
});

export default kafka;

