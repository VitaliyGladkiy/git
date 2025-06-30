const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config(); // For environment variables

// Database configuration for AWS RDS
const sequelize = new Sequelize({
  dialect: 'mysql', // or 'postgres', 'sqlite', 'mariadb', 'mssql'
  host: 'https://3.32.32.99', // Your AWS RDS endpoint
  port: 3306,
  database: 'users',
  username: 'root',
  password: '36dfg654ssdf$@321!',
  
  // AWS RDS specific configurations
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // For AWS RDS SSL
    },
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
  },
  
  // Connection pool settings
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  // Logging (set to false in production)
  logging: console.log,
  
  // Timezone configuration
  timezone: '+00:00'
});

// User model definition
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 100]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true, // Adds createdAt and updatedAt
  underscored: true, // Uses snake_case for column names
});

// Database connection and initialization
async function initializeDatabase() {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: false }); // Set to true in development only
    console.log('✅ Database models synchronized.');
    
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    throw error;
  }
}

// User service functions
class UserService {
  
  // Create a new user
  static async createUser(userData) {
    try {
      const { firstName, lastName, email, password } = userData;
      
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user
      const newUser = await User.create({
        firstName,
        lastName,
        email,
        password // In production, hash this password first!
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser.toJSON();
      return userWithoutPassword;
      
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  // Get user by ID
  static async getUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] } // Exclude password from result
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user.toJSON();
      
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }
  
  // Get user by email
  static async getUserByEmail(email) {
    try {
      const user = await User.findOne({
        where: { email },
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user.toJSON();
      
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }
  
  // Get all users with pagination
  static async getAllUsers(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await User.findAndCountAll({
        attributes: { exclude: ['password'] },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });
      
      return {
        users: rows.map(user => user.toJSON()),
        totalUsers: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      };
      
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  
  // Update user
  static async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.update(updateData);
      
      // Return updated user without password
      const { password: _, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
      
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  // Delete user
  static async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.destroy();
      return { message: 'User deleted successfully' };
      
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

// Example usage and testing
async function main() {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Example 1: Create a new user
    console.log('\n🔹 Creating a new user...');
    const newUser = await UserService.createUser({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123'
    });
    console.log('Created user:', newUser);
    
    // Example 2: Get user by ID
    console.log('\n🔹 Fetching user by ID...');
    const userById = await UserService.getUserById(newUser.id);
    console.log('User by ID:', userById);
    
    // Example 3: Get user by email
    console.log('\n🔹 Fetching user by email...');
    const userByEmail = await UserService.getUserByEmail('john.doe@example.com');
    console.log('User by email:', userByEmail);
    
    // Example 4: Get all users with pagination
    console.log('\n🔹 Fetching all users...');
    const allUsers = await UserService.getAllUsers(1, 5);
    console.log('All users:', allUsers);
    
    // Example 5: Update user
    console.log('\n🔹 Updating user...');
    const updatedUser = await UserService.updateUser(newUser.id, {
      firstName: 'Jane',
      isActive: false
    });
    console.log('Updated user:', updatedUser);
    
  } catch (error) {
    console.error('❌ Error in main function:', error.message);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await sequelize.close();
  console.log('✅ Database connection closed.');
  process.exit(0);
});

// Export for use in other modules
module.exports = {
  sequelize,
  User,
  UserService,
  initializeDatabase
};

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}