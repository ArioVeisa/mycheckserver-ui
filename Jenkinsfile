pipeline {
    agent any
    
    environment {
        NVM_DIR = '/var/lib/jenkins/.nvm'
        DOCKER_IMAGE = 'mycheckserver'
        CONTAINER_NAME = 'mycheckserver-app'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                sh '''
                    # Install nvm and Node.js if not present
                    if [ ! -d "$NVM_DIR" ]; then
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                    fi
                    export NVM_DIR="/var/lib/jenkins/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm install 20 || true
                    nvm use 20
                    node --version
                    npm --version
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    export NVM_DIR="/var/lib/jenkins/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use 20
                    npm ci
                '''
                dir('backend') {
                    sh '''
                        export NVM_DIR="/var/lib/jenkins/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use 20
                        npm ci
                    '''
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                sh '''
                    export NVM_DIR="/var/lib/jenkins/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use 20
                    VITE_API_URL=/api npm run build
                '''
            }
        }
        
        stage('Prepare Deployment') {
            steps {
                sh '''
                    rm -rf deploy
                    mkdir -p deploy/public
                    cp -r dist/* deploy/public/
                    cp -r backend/* deploy/
                    rm -rf deploy/data.db* deploy/node_modules
                    
                    cat > deploy/server.js << 'EOF'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import 'dotenv/config';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import and use routes (they use SQLite internally via database.js)
import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import billingRoutes from './routes/billing.js';
import notificationRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import { trackApiVisit } from './middleware/trackVisitor.js';
import { runMonitoringCycle, sendTestEmail } from './services/monitorService.js';
import { authenticate } from './middleware/auth.js';

// Apply middlewares
app.use('/api', trackApiVisit);

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Config endpoint
app.get('/api/config/midtrans', (req, res) => {
  res.json({
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
  });
});

// Report endpoint
app.post('/api/send-report', authenticate, async (req, res) => {
  try {
    const result = await sendTestEmail(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Send report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cron Job for Monitoring (every minute)
cron.schedule('* * * * *', async () => {
  console.log('Running monitoring cycle...');
  try {
    await runMonitoringCycle();
  } catch (error) {
    console.error('Monitoring cycle error:', error);
  }
});

// Frontend fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
EOF

                    cat > deploy/package.json << 'EOF'
{
  "name": "mycheckserver",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "midtrans-client": "^1.3.1",
    "mssql": "^12.2.0",
    "mysql2": "^3.16.0",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.14",
    "sql.js": "^1.13.0",
    "uuid": "^10.0.0"
  },
  "engines": { "node": ">=18.0.0" }
}
EOF
                '''
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t ${DOCKER_IMAGE}:latest .
                '''
            }
        }
        
        stage('Deploy Container') {
            steps {
                sh '''
                    # Stop and remove old container if exists
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                    
                    # Run new container
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p 80:8080 \
                        -e PORT=8080 \
                        -e JWT_SECRET=your-jwt-secret-here \
                        -e NODE_ENV=production \
                        ${DOCKER_IMAGE}:latest
                    
                    # Show running containers
                    docker ps
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo "Deployed to http://52.230.95.159"
        }
    }
}
