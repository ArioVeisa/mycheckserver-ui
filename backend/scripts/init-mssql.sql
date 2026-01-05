USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'mycheckserver')
BEGIN
    CREATE DATABASE mycheckserver;
END
GO

USE mycheckserver;
GO

-- Users Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL DEFAULT '',
        role NVARCHAR(50) DEFAULT 'user',
        [plan] NVARCHAR(50) DEFAULT 'free',
        plan_expires_at DATETIME,
        email_verified BIT DEFAULT 0,
        whatsapp NVARCHAR(50),
        whatsapp_verified BIT DEFAULT 0,
        google_id NVARCHAR(255),
        avatar NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Servers Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='servers' AND xtype='U')
BEGIN
    CREATE TABLE servers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        name NVARCHAR(255) NOT NULL,
        domain NVARCHAR(255) NOT NULL,
        [interval] INT DEFAULT 5,
        email_notif BIT DEFAULT 1,
        whatsapp_notif BIT DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'unknown',
        response_time INT,
        last_check DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Server Logs Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='server_logs' AND xtype='U')
BEGIN
    CREATE TABLE server_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        server_id INT NOT NULL,
        status_code INT,
        response_time INT,
        status NVARCHAR(50),
        message NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
END
GO

-- Notifications Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notifications' AND xtype='U')
BEGIN
    CREATE TABLE notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        server_id INT,
        type NVARCHAR(50),
        title NVARCHAR(255),
        message NVARCHAR(MAX),
        [read] BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL
    );
END
GO

-- Notification Settings Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notification_settings' AND xtype='U')
BEGIN
    CREATE TABLE notification_settings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        email_enabled BIT DEFAULT 1,
        whatsapp_enabled BIT DEFAULT 0,
        notify_down BIT DEFAULT 1,
        notify_up BIT DEFAULT 1,
        server_down BIT DEFAULT 1,
        slow_response BIT DEFAULT 0,
        slow_threshold INT DEFAULT 5000,
        daily_summary BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Payments Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='payments' AND xtype='U')
BEGIN
    CREATE TABLE payments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        order_id NVARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        [plan] NVARCHAR(50) DEFAULT 'pro',
        status NVARCHAR(50) DEFAULT 'pending',
        payment_type NVARCHAR(50),
        transaction_id NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Page Visits Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='page_visits' AND xtype='U')
BEGIN
    CREATE TABLE page_visits (
        id INT IDENTITY(1,1) PRIMARY KEY,
        path NVARCHAR(255) NOT NULL,
        ip_address NVARCHAR(50),
        user_agent NVARCHAR(MAX),
        user_id INT,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
END
GO
