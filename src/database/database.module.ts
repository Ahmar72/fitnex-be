import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

/**
 * Database Module
 * 
 * Manages the MongoDB connection using Mongoose.
 * Features asynchronous configuration loading, lifecycle connection logging,
 * and graceful timeout handling for remote and local MongoDB clusters.
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('mongodb.uri') || 'mongodb://localhost:27017/fitnex';
        const logger = new Logger('DatabaseModule');

        return {
          uri,
          serverSelectionTimeoutMS: 5000, // 5 second timeout if MongoDB is offline
          autoIndex: true,
          connectionFactory: (connection: Connection) => {
            connection.on('connected', () => {
              const sanitizedUri = uri.includes('@') ? uri.split('@')[1] : uri;
              logger.log(`Successfully connected to MongoDB database at [${sanitizedUri}]`);
            });
            connection.on('error', (error) => {
              logger.error(`MongoDB connection error: ${error.message}`);
              logger.warn(
                'Tip: Verify your MongoDB connection string in .env (MONGODB_URI) or ensure MongoDB is running.',
              );
            });
            connection.on('disconnected', () => {
              logger.warn('MongoDB connection disconnected');
            });
            return connection;
          },
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
