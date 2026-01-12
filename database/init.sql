-- Initial database setup for DNS Manager
-- This script runs automatically when PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The tables will be created automatically by Sequelize sync
-- This file is for any additional database initialization

-- Grant permissions (if using a separate app user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dns_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dns_user;
