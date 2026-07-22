module.exports = {
  apps: [
    {
      name: "finance-tracker",
      cwd: "/root/apps/finance-tracker",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3010,
        HOSTNAME: "127.0.0.1",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      error_file: "/var/log/pm2/finance-tracker-error.log",
      out_file: "/var/log/pm2/finance-tracker-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
