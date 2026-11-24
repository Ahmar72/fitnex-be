import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Health Controller
 * 
 * Provides system diagnostics and status indicators for MongoDB,
 * memory, uptime, and API availability.
 */
@ApiTags('System & Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection()
    private readonly mongoConnection: Connection,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'System health and database status',
    description: 'Returns API health, server uptime, and active MongoDB connection status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed successfully',
  })
  getHealth() {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const stateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const mongoState = stateMap[this.mongoConnection.readyState] || 'unknown';

    return {
      status: 'healthy',
      app: 'Fitnex Backend API',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        type: 'MongoDB',
        status: mongoState,
        connected: this.mongoConnection.readyState === 1,
      },
    };
  }
}
