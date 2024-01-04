const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('mysql');

const User = sequelize.define('User', {
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING,        
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
           isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING
    },
    passwordChangedAt: {
        type: DataTypes.DATE
    },
    passwordResetToken: {
        type: DataTypes.STRING
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
    },
    createdAt: {
        type: DataTypes.DATE
    }, updatedAt: {
        type: DataTypes.DATE
    }
});

// Synchronize the model with the database
// This function will delete all existing tables in the database
async function syncDatabase() {
    await sequelize.sync();
    console.log('Database synchronized.');
  }
  // Example usage
  // recommended to be in controller file
  async function run() {
  
    await syncDatabase();// remember to comment this after server runs ones.
    // Create a new user
    const newUser = await User.create({
      firstName: 'john_doe',
      lastName: "Varner",
      email: 'john.doe@example.com',
    });
    console.log('New user created:', newUser.toJSON());
  }
  run();

 module.exports = User;
  