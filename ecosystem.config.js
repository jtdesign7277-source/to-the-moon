/**
 * PM2 Ecosystem Configuration
 * 
 * This file configures PM2 to manage both frontend and backend processes.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js     # Start all apps
 *   pm2 stop all                       # Stop all apps
 *   pm2 restart all                    # Restart all apps
 *   pm2 logs                           # View all logs
 *   pm2 status                         # Check status
 *   pm2 save                           # Save process list
 *   pm2 startup                        # Auto-start on system boot
 */

module.exports = {
  apps: [
    {
      name: 'ttm-backend',
      script: 'python3',
      args: 'api_server.py',
      cwd: './backend',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        PORT: 5001,
        FLASK_ENV: 'development',
        FLASK_DEBUG: 1
      },
      env_production: {
        FLASK_ENV: 'production',
        FLASK_DEBUG: 0
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'ttm-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        PORT: 5173
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
