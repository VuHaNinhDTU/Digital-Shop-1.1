const User = require('./userModel');

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    await user.save();
    return user;
  }
  async findById(id) {
    return User.findById(id);
  }
  async findByUsername(username) {
    return User.findOne({ username });
  }
  async findAll() {
    return User.find();
  }
  async update(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true });
  }
  async delete(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository(); 