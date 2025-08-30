const db = require('../config/mockDatabase');
const bcrypt = require('bcryptjs');

const userController = {
  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await db('users')
        .select('id', 'email', 'role', 'reward_points', 'created_at', 'manufacturer_id')
        .where('id', userId)
        .first();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get manufacturer info if applicable
      let manufacturer = null;
      if (user.manufacturer_id) {
        manufacturer = await db('manufacturers')
          .select('name', 'location', 'contact_email')
          .where('id', user.manufacturer_id)
          .first();
      }

      res.json({
        success: true,
        data: {
          ...user,
          manufacturer
        }
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { email, current_password, new_password } = req.body;

      // Get current user
      const user = await db('users')
        .select('*')
        .where('id', userId)
        .first();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updates = {};

      // Update email if provided
      if (email && email !== user.email) {
        // Check if email is already taken
        const existingUser = await db('users')
          .where('email', email)
          .where('id', '!=', userId)
          .first();

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }

        updates.email = email;
      }

      // Update password if provided
      if (new_password) {
        if (!current_password) {
          return res.status(400).json({
            success: false,
            message: 'Current password is required'
          });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(current_password, user.password);
        if (!isValidPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
          });
        }

        // Hash new password
        const saltRounds = 10;
        updates.password = await bcrypt.hash(new_password, saltRounds);
      }

      // Update user
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date();
        await db('users')
          .where('id', userId)
          .update(updates);
      }

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get user statistics
  async getStats(req, res) {
    try {
      const userId = req.user.id;

      const validations = await db('token_validations')
        .where('user_id', userId)
        .count('id as count')
        .first();

      const reports = await db('counterfeit_reports')
        .where('user_id', userId)
        .count('id as count')
        .first();

      const rewardTransactions = await db('reward_transactions')
        .where('user_id', userId)
        .where('type', 'earned')
        .sum('points as total_earned')
        .first();

      res.json({
        success: true,
        data: {
          total_validations: parseInt(validations.count),
          total_reports: parseInt(reports.count),
          total_points_earned: parseInt(rewardTransactions.total_earned) || 0
        }
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Delete user account
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      // Get user
      const user = await db('users')
        .select('*')
        .where('id', userId)
        .first();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password is incorrect'
        });
      }

      // Delete user (this will cascade delete related records)
      await db('users')
        .where('id', userId)
        .del();

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = userController;