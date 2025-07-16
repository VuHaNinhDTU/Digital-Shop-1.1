#!/usr/bin/env node

const mongoose = require('mongoose');
const DatabaseOptimizer = require('../shared/databaseOptimization');

// Import all models to ensure they're registered
require('../product_service/productModel');
require('../user_service/userModel');
require('../order_service/orderModel');

class DatabaseOptimizationRunner {
  constructor() {
    this.optimizer = new DatabaseOptimizer();
  }

  async connectToDatabase() {
    try {
      console.log('🔌 Connecting to database...');
      
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cho-nong-san-so-gateway';
      
      // Use optimized connection options
      const options = this.optimizer.getOptimizedConnectionOptions();
      
      await mongoose.connect(mongoUri, options);
      console.log('✅ Database connected successfully\n');
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async run() {
    console.log('=====================================');
    console.log('🚀 CHỢ NÔNG SÂN SỐ - DATABASE OPTIMIZER');
    console.log('=====================================\n');

    try {
      // Step 1: Connect to database
      const connected = await this.connectToDatabase();
      if (!connected) {
        process.exit(1);
      }

      // Step 2: Run optimization
      const result = await this.optimizer.runOptimization();

      if (result.success) {
        console.log('🎉 Database optimization completed successfully!');
        console.log(`⏱️  Total time: ${result.duration}ms`);
        console.log('\n📊 Performance Improvements:');
        
        Object.entries(result.improvements).forEach(([key, value]) => {
          console.log(`   • ${key}: ${value}`);
        });

        console.log('\n🔍 Index Statistics:');
        if (result.indexStats) {
          Object.entries(result.indexStats).forEach(([collection, indexes]) => {
            console.log(`   • ${collection}: ${Object.keys(indexes).length} indexes`);
          });
        }

        console.log('\n✅ Optimization completed successfully!');
        console.log('🚀 Your database is now optimized for maximum performance!');
        
      } else {
        console.error('❌ Optimization failed:', result.error);
        process.exit(1);
      }

    } catch (error) {
      console.error('💥 Unexpected error:', error.message);
      process.exit(1);
    } finally {
      // Close database connection
      await mongoose.connection.close();
      console.log('\n🔒 Database connection closed');
    }
  }
}

// Run the optimizer if this script is executed directly
if (require.main === module) {
  const runner = new DatabaseOptimizationRunner();
  runner.run().catch(error => {
    console.error('💥 Failed to run database optimization:', error);
    process.exit(1);
  });
}

module.exports = DatabaseOptimizationRunner; 