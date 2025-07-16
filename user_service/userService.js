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
    const errors = this.validateUserData(data);
    if (errors.length) return { errors };
    if (await repo.findByUsername(data.username)) return { errors: ['Username exists'] };
    return { user: await repo.create(data) };
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
    return repo.update(id, data);
  }
  async deleteUser(id) {
    return repo.delete(id);
  }
}

module.exports = new UserService(); 