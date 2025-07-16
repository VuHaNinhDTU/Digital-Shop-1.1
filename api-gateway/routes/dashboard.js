const express = require('express');
const path = require('path');
const router = express.Router();
const serviceRegistry = require('../services/serviceRegistry');
const healthChecker = require('../services/healthChecker');
const analyticsService = require('../services/analyticsService');
const config = require('../config');
const logger = require('../utils/logger');

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

const dashboardAuth = (req, res, next) => {
  if (!config.dashboard.authRequired) {
    return next();
  }

  const auth = req.headers.authorization;
  
  if (!auth) {
    res.set('WWW-Authenticate', 'Basic realm="API Gateway Dashboard"');
    return res.status(401).send('Authentication required');
  }

  if (!auth.startsWith('Basic ')) {
    return res.status(401).send('Invalid authentication method');
  }

  const credentials = Buffer.from(auth.slice(6), 'base64').toString().split(':');
  const username = credentials[0];
  const password = credentials[1];

  if (username !== config.dashboard.username || password !== config.dashboard.password) {
    return res.status(401).send('Invalid credentials');
  }

  next();
};

// ========================================
// DASHBOARD HOME PAGE
// ========================================

router.get('/', dashboardAuth, (req, res) => {
  try {
    const dashboardHtml = generateDashboardHTML();
    res.send(dashboardHtml);
  } catch (error) {
    logger.error('Error serving dashboard:', error);
    res.status(500).send('Dashboard unavailable');
  }
});

// ========================================
// DASHBOARD DATA ENDPOINTS
// ========================================

// Lấy dashboard data chính
router.get('/api/data', dashboardAuth, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '1h';
    
    const [
      systemOverview,
      healthSummary,
      dashboardStats,
      realTimeMetrics
    ] = await Promise.all([
      serviceRegistry.getSystemOverview(),
      healthChecker.getHealthSummary(),
      analyticsService.getDashboardStats(timeRange),
      analyticsService.getRealTimeMetrics()
    ]);

    const dashboardData = {
      timestamp: new Date().toISOString(),
      timeRange,
      system: systemOverview,
      health: healthSummary,
      analytics: dashboardStats,
      realTime: realTimeMetrics,
      gateway: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        environment: config.server.env
      }
    };

    res.json(dashboardData);

  } catch (error) {
    logger.error('Error getting dashboard data:', error);
    res.status(500).json({
      error: 'Failed to retrieve dashboard data',
      message: error.message
    });
  }
});

// Lấy service details
router.get('/api/services', dashboardAuth, async (req, res) => {
  try {
    const services = serviceRegistry.getAllServices();
    const serviceDetails = {};

    for (const [serviceName, serviceInfo] of Object.entries(services)) {
      const stats = serviceRegistry.getServiceStats(serviceName);
      const healthHistory = healthChecker.getHealthHistory(serviceName);

      serviceDetails[serviceName] = {
        ...serviceInfo,
        stats,
        healthHistory: healthHistory ? {
          uptime: healthHistory.uptimePercentage,
          totalChecks: healthHistory.totalChecks,
          consecutiveFailures: healthHistory.consecutiveFailures,
          lastSuccessful: healthHistory.lastSuccessful,
          lastFailure: healthHistory.lastFailure
        } : null
      };
    }

    res.json({
      timestamp: new Date().toISOString(),
      services: serviceDetails
    });

  } catch (error) {
    logger.error('Error getting services data:', error);
    res.status(500).json({
      error: 'Failed to retrieve services data',
      message: error.message
    });
  }
});

// Lấy analytics data
router.get('/api/analytics', dashboardAuth, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '1h';
    const limit = parseInt(req.query.limit) || 10;

    const [
      dashboardStats,
      topEndpoints,
      errorAnalysis
    ] = await Promise.all([
      analyticsService.getDashboardStats(timeRange),
      analyticsService.getTopEndpoints(limit, timeRange),
      analyticsService.getErrorAnalysis(timeRange)
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      timeRange,
      limit,
      stats: dashboardStats,
      topEndpoints,
      errors: errorAnalysis
    });

  } catch (error) {
    logger.error('Error getting analytics data:', error);
    res.status(500).json({
      error: 'Failed to retrieve analytics data',
      message: error.message
    });
  }
});

// Lấy health data
router.get('/api/health', dashboardAuth, async (req, res) => {
  try {
    const healthSummary = healthChecker.getHealthSummary();
    const allHistories = healthChecker.getAllHealthHistories();

    res.json({
      timestamp: new Date().toISOString(),
      summary: healthSummary,
      histories: allHistories
    });

  } catch (error) {
    logger.error('Error getting health data:', error);
    res.status(500).json({
      error: 'Failed to retrieve health data',
      message: error.message
    });
  }
});

// ========================================
// DASHBOARD CONTROL ENDPOINTS
// ========================================

// Trigger health check cho service
router.post('/api/health-check/:serviceName', dashboardAuth, async (req, res) => {
  try {
    const { serviceName } = req.params;
    const result = await serviceRegistry.checkServiceHealth(serviceName);

    // Emit update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('healthCheckTriggered', {
        serviceName,
        result,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      serviceName,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Manual health check failed for ${req.params.serviceName}:`, error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Toggle service status
router.post('/api/service/:serviceName/toggle', dashboardAuth, async (req, res) => {
  try {
    const { serviceName } = req.params;
    const service = serviceRegistry.getService(serviceName);

    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
        serviceName
      });
    }

    // Toggle service status (giả lập)
    const newStatus = service.status === 'healthy' ? 'maintenance' : 'healthy';
    service.status = newStatus;

    // Emit update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('serviceStatusChanged', {
        serviceName,
        oldStatus: service.status,
        newStatus,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`Service ${serviceName} status changed to ${newStatus} via dashboard`);

    res.json({
      serviceName,
      oldStatus: service.status,
      newStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Failed to toggle service ${req.params.serviceName}:`, error);
    res.status(500).json({
      error: 'Failed to toggle service',
      message: error.message
    });
  }
});

// ========================================
// WEBSOCKET DATA STREAMING
// ========================================

// Setup WebSocket events
router.get('/api/websocket-setup', dashboardAuth, (req, res) => {
  const io = req.app.get('io');
  
  if (!io) {
    return res.status(500).json({
      error: 'WebSocket not available'
    });
  }

  // Start real-time data streaming
  const streamInterval = setInterval(() => {
    const realTimeData = {
      timestamp: new Date().toISOString(),
      systemOverview: serviceRegistry.getSystemOverview(),
      realTimeMetrics: analyticsService.getRealTimeMetrics(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    io.emit('realTimeUpdate', realTimeData);
  }, 5000); // Update every 5 seconds

  // Clean up interval when client disconnects
  req.on('close', () => {
    clearInterval(streamInterval);
  });

  res.json({
    message: 'WebSocket streaming setup complete',
    updateInterval: 5000,
    timestamp: new Date().toISOString()
  });
});

// ========================================
// DASHBOARD HTML GENERATOR
// ========================================

function generateDashboardHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Gateway Dashboard - Chợ Nông Sản Số</title>
    
    <!-- CSS Frameworks -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" rel="stylesheet">
    
    <!-- Chart.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    
    <!-- Socket.IO -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.4/socket.io.js"></script>
    
    <style>
        .glass {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .status-healthy { @apply bg-green-500 text-white; }
        .status-unhealthy { @apply bg-red-500 text-white; }
        .status-unknown { @apply bg-yellow-500 text-white; }
        .status-maintenance { @apply bg-blue-500 text-white; }
        
        .metric-card {
            transition: all 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .pulse-animation {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .loading-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <!-- Header -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <i class="fas fa-network-wired text-2xl"></i>
                    <h1 class="text-2xl font-bold">API Gateway Dashboard</h1>
                    <span class="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">Chợ Nông Sản Số</span>
                </div>
                
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-green-400 rounded-full pulse-animation"></div>
                        <span id="connectionStatus">Connected</span>
                    </div>
                    
                    <button id="darkModeToggle" class="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors">
                        <i class="fas fa-moon"></i>
                    </button>
                    
                    <button id="refreshBtn" class="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- System Overview Cards -->
        <div id="systemOverview" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Cards will be dynamically generated -->
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Response Time Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 metric-card">
                <h3 class="text-xl font-semibold mb-4 dark:text-white">Response Time Trends</h3>
                <canvas id="responseTimeChart" width="400" height="200"></canvas>
            </div>

            <!-- Request Volume Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 metric-card">
                <h3 class="text-xl font-semibold mb-4 dark:text-white">Request Volume</h3>
                <canvas id="requestVolumeChart" width="400" height="200"></canvas>
            </div>
        </div>

        <!-- Services Status Table -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold dark:text-white">Services Status</h3>
            </div>
            <div class="overflow-x-auto">
                <table id="servicesTable" class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Uptime</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Response Time</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requests</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Error Rate</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="servicesTableBody" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <!-- Table rows will be dynamically generated -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Real-time Logs -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold dark:text-white">Real-time Activity</h3>
                <button id="clearLogsBtn" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    <i class="fas fa-trash mr-2"></i>Clear
                </button>
            </div>
            <div id="realTimeLogs" class="h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <!-- Logs will be dynamically added -->
            </div>
        </div>
    </main>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="display: none;">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-8 flex items-center space-x-4">
            <div class="loading-spinner"></div>
            <span class="text-lg dark:text-white">Loading dashboard data...</span>
        </div>
    </div>

    <script>
        // Dashboard JavaScript will be added in the next part
        ${generateDashboardJavaScript()}
    </script>
</body>
</html>
  `;
}

function generateDashboardJavaScript() {
  return `
    // Dashboard State
    let socket = null;
    let charts = {};
    let isDarkMode = false;
    let dashboardData = {};

    // Initialize Dashboard
    document.addEventListener('DOMContentLoaded', function() {
        initializeSocket();
        initializeDarkMode();
        loadDashboardData();
        setupEventListeners();
        startAutoRefresh();
    });

    // Socket.IO Connection
    function initializeSocket() {
        socket = io();
        
        socket.on('connect', function() {
            updateConnectionStatus(true);
            addLog('Connected to API Gateway', 'success');
        });
        
        socket.on('disconnect', function() {
            updateConnectionStatus(false);
            addLog('Disconnected from API Gateway', 'error');
        });
        
        socket.on('realTimeUpdate', function(data) {
            updateRealTimeData(data);
        });
        
        socket.on('healthStatusUpdate', function(data) {
            updateHealthStatus(data);
        });
        
        socket.on('alert', function(alert) {
            showAlert(alert);
        });
        
        socket.on('serviceStatusChanged', function(data) {
            addLog(\`Service \${data.serviceName} status changed to \${data.newStatus}\`, 'info');
            loadDashboardData();
        });
    }

    // Load Dashboard Data
    async function loadDashboardData() {
        showLoading(true);
        
        try {
            const response = await fetch('/dashboard/api/data');
            const data = await response.json();
            
            dashboardData = data;
            updateSystemOverview(data.system);
            updateCharts(data);
            await loadServicesData();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            addLog('Failed to load dashboard data', 'error');
        } finally {
            showLoading(false);
        }
    }

    // Update System Overview Cards
    function updateSystemOverview(systemData) {
        const overviewContainer = document.getElementById('systemOverview');
        
        const cards = [
            {
                title: 'Total Services',
                value: systemData.totalServices,
                icon: 'fas fa-server',
                color: 'blue',
                change: '+0'
            },
            {
                title: 'Healthy Services',
                value: systemData.healthyServices,
                icon: 'fas fa-check-circle',
                color: 'green',
                change: '+0'
            },
            {
                title: 'Total Requests',
                value: systemData.totalRequests.toLocaleString(),
                icon: 'fas fa-exchange-alt',
                color: 'purple',
                change: '+' + Math.floor(Math.random() * 100)
            },
            {
                title: 'System Uptime',
                value: formatUptime(systemData.uptime),
                icon: 'fas fa-clock',
                color: 'indigo',
                change: 'Online'
            }
        ];
        
        overviewContainer.innerHTML = cards.map(card => \`
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 metric-card animate__animated animate__fadeInUp">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-\${card.color}-600 text-sm font-medium">\${card.title}</p>
                        <p class="text-3xl font-bold dark:text-white">\${card.value}</p>
                        <p class="text-gray-500 text-sm">\${card.change}</p>
                    </div>
                    <div class="p-3 bg-\${card.color}-100 rounded-full">
                        <i class="\${card.icon} text-\${card.color}-600 text-2xl"></i>
                    </div>
                </div>
            </div>
        \`).join('');
    }

    // Load Services Data
    async function loadServicesData() {
        try {
            const response = await fetch('/dashboard/api/services');
            const data = await response.json();
            
            updateServicesTable(data.services);
            
        } catch (error) {
            console.error('Error loading services data:', error);
        }
    }

    // Update Services Table
    function updateServicesTable(services) {
        const tableBody = document.getElementById('servicesTableBody');
        
        const rows = Object.entries(services).map(([serviceName, service]) => \`
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">\${serviceName}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full status-\${service.status}">
                        \${service.status.toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    \${service.healthHistory ? service.healthHistory.uptime.toFixed(1) + '%' : 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    \${service.responseTime ? service.responseTime.toFixed(0) + 'ms' : 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    \${service.requestCount.toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    \${service.errorCount > 0 ? ((service.errorCount / service.requestCount) * 100).toFixed(1) + '%' : '0%'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button onclick="triggerHealthCheck('\${serviceName}')" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-heartbeat"></i>
                    </button>
                    <button onclick="toggleService('\${serviceName}')" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-power-off"></i>
                    </button>
                </td>
            </tr>
        \`).join('');
        
        tableBody.innerHTML = rows;
    }

    // Utility Functions
    function formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 3600));
        const hours = Math.floor((seconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) return \`\${days}d \${hours}h\`;
        if (hours > 0) return \`\${hours}h \${minutes}m\`;
        return \`\${minutes}m\`;
    }

    function addLog(message, type = 'info') {
        const logsContainer = document.getElementById('realTimeLogs');
        const timestamp = new Date().toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = \`mb-1 text-\${type === 'error' ? 'red' : type === 'success' ? 'green' : 'gray'}-600\`;
        logEntry.innerHTML = \`[\${timestamp}] \${message}\`;
        
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
        
        // Keep only last 50 logs
        const logs = logsContainer.children;
        if (logs.length > 50) {
            logsContainer.removeChild(logs[0]);
        }
    }

    function showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    function updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = connected ? 'Connected' : 'Disconnected';
        statusElement.previousElementSibling.className = 
            \`w-3 h-3 rounded-full \${connected ? 'bg-green-400 pulse-animation' : 'bg-red-400'}\`;
    }

    // Event Handlers
    async function triggerHealthCheck(serviceName) {
        try {
            const response = await fetch(\`/dashboard/api/health-check/\${serviceName}\`, {
                method: 'POST'
            });
            
            if (response.ok) {
                addLog(\`Health check triggered for \${serviceName}\`, 'info');
            } else {
                addLog(\`Failed to trigger health check for \${serviceName}\`, 'error');
            }
        } catch (error) {
            addLog(\`Error triggering health check: \${error.message}\`, 'error');
        }
    }

    async function toggleService(serviceName) {
        try {
            const response = await fetch(\`/dashboard/api/service/\${serviceName}/toggle\`, {
                method: 'POST'
            });
            
            if (response.ok) {
                addLog(\`Service \${serviceName} toggled\`, 'info');
                loadDashboardData();
            } else {
                addLog(\`Failed to toggle service \${serviceName}\`, 'error');
            }
        } catch (error) {
            addLog(\`Error toggling service: \${error.message}\`, 'error');
        }
    }

    // Setup Event Listeners
    function setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', loadDashboardData);
        document.getElementById('clearLogsBtn').addEventListener('click', () => {
            document.getElementById('realTimeLogs').innerHTML = '';
        });
        document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    }

    // Dark Mode
    function initializeDarkMode() {
        isDarkMode = localStorage.getItem('darkMode') === 'true';
        updateDarkMode();
    }

    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        localStorage.setItem('darkMode', isDarkMode);
        updateDarkMode();
    }

    function updateDarkMode() {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    // Auto Refresh
    function startAutoRefresh() {
        setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    }

    // Update functions for real-time data
    function updateRealTimeData(data) {
        // Update real-time metrics here
    }

    function updateHealthStatus(data) {
        // Update health status here
    }

    function showAlert(alert) {
        addLog(\`ALERT: \${alert.message}\`, 'error');
    }

    function updateCharts(data) {
        // Chart updates will be implemented based on actual data structure
    }
  `;
}

module.exports = router; 