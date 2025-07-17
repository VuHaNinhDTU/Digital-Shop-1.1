const repo = require('./userRepo');

class UserService {
  validateUserData(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      errors.push('No data provided');
      return errors;
    }
    if (!data.username || data.username.length < 2) errors.push('Username too short');
    if (!data.password || data.password.length < 4) errors.push('Password too short');
    if (!data.email) errors.push('Email required');
    return errors;
  }
  async register(data) {
    console.log('📝 Registering user with data:', { ...data, password: '[HIDDEN]' });
    const errors = this.validateUserData(data);
    if (errors.length) return { errors };
    if (await repo.findByUsername(data.username)) return { errors: ['Username exists'] };
    console.log('💾 Saving user to database...');
    const user = await repo.create(data);
    console.log('✅ User saved to database:', user._id);
    return { user };
  }
  async login({ username, password }) {
    const user = await repo.findByUsername(username);
    if (!user || user.password !== password) return null;
    return user;
  }
  async getUser(id) {
    return repo.findById(id);
  }
  async getAllUsers() {
    return repo.findAll();
  }
  async updateUser(id, data) {
    console.log(`📝 Updating user ${id} with data:`, { ...data, password: data.password ? '[HIDDEN]' : undefined });
    const result = await repo.update(id, data);
    console.log('✅ User updated:', result?._id);
    return result;
  }
  async deleteUser(id) {
    console.log(`🗑️ Deleting user ${id}`);
    const result = await repo.delete(id);
    console.log('✅ User deleted:', result?._id);
    return result;
  }
}

module.exports = new UserService(); 