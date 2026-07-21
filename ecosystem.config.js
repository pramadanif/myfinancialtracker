module.exports = {
  apps: [{
    name: "finance-tracker",
    script: "node_modules/next/dist/bin/next",
    args: "start",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: "500M",
  }],
};
