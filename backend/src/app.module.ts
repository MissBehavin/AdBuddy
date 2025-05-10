import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AdGenerationModule } from './ad-generation/ad-generation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-ad-generator'),
    CampaignsModule,
    ProductsModule,
    UsersModule,
    AdGenerationModule,
  ],
})
export class AppModule {} 