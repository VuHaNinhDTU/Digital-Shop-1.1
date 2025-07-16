const service = require('./userService');

class UserController {
  async register(req, res) {
    const result = await service.register(req.body);
    if (result.errors) return res.status(400).json({ success: false, errors: result.errors });
    res.status(201).json({ success: true, data: result.user });
  }
  async login(req, res) {
    const user = await service.login(req.body);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, data: user });
  }
  async getById(req, res) {
    const user = await service.getUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: user });
  }
  async getAll(req, res) {
    const users = await service.getAllUsers();
    res.json({ success: true, data: users });
  }
  async update(req, res) {
    const user = await service.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: user });
  }
  async delete(req, res) {
    const user = await service.deleteUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: user });
  }
}

module.exports = new UserController(); 