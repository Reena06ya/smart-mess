// Root entry proxy for Render / Cloud deployments
// Adds backend/node_modules to module resolution paths so all backend dependencies resolve seamlessly
const path = require('path');
const Module = require('module');

const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
if (!module.paths.includes(backendNodeModules)) {
  module.paths.unshift(backendNodeModules);
}
if (!Module.globalPaths.includes(backendNodeModules)) {
  Module.globalPaths.unshift(backendNodeModules);
}

require('./backend/server.js');
