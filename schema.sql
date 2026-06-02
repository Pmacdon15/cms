-- CMS Database Schema DDL
-- Execute these queries in your Neon PostgreSQL database console.

-- Enable pgcrypto for gen_random_uuid() if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clients table (with local opt-in settings)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    opt_in_newsletter BOOLEAN DEFAULT TRUE NOT NULL,
    opt_in_sms BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Mailing Lists table
CREATE TABLE IF NOT EXISTS mailing_lists (
    name VARCHAR(255) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Mailing List Subscriptions junction table
CREATE TABLE IF NOT EXISTS mailing_list_subscriptions (
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    mailing_list_name VARCHAR(255) REFERENCES mailing_lists(name) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'subscribed' NOT NULL, -- 'subscribed' or 'unsubscribed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (client_id, mailing_list_name)
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'email', 'sms', or 'both'
    subject VARCHAR(255), -- NULL for SMS only campaigns
    content TEXT NOT NULL,
    sent_count INTEGER DEFAULT 0 NOT NULL,
    mailing_list_name VARCHAR(255), -- Mailing List targeted (e.g. 'TanStackFormNewsletter')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sent Messages tracking logs
CREATE TABLE IF NOT EXISTS sent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL, -- 'email' or 'sms'
    status VARCHAR(50) NOT NULL, -- 'sent' or 'failed'
    aws_message_id VARCHAR(255), -- SES Message ID or Pinpoint Message ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance & quick queries
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_sent_messages_campaign ON sent_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sent_messages_client ON sent_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_mls_list_name ON mailing_list_subscriptions(mailing_list_name);

-- Seed default mailing lists
INSERT INTO mailing_lists (name, description) VALUES
('TanStackFormNewsletter', 'Default customer newsletter campaign list.'),
('ApexWeeklyDigest', 'Weekly executive summaries and updates.')
ON CONFLICT (name) DO NOTHING;

-- MIGRATION NOTE FOR EXISTING DB INSTANCES:
-- If your tables already exist, run the following statements:
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS opt_in_newsletter BOOLEAN DEFAULT TRUE NOT NULL;
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS opt_in_sms BOOLEAN DEFAULT TRUE NOT NULL;
--
-- CREATE TABLE IF NOT EXISTS mailing_lists (
--     name VARCHAR(255) PRIMARY KEY,
--     description TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
-- );
--
-- CREATE TABLE IF NOT EXISTS mailing_list_subscriptions (
--     client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
--     mailing_list_name VARCHAR(255) REFERENCES mailing_lists(name) ON DELETE CASCADE,
--     status VARCHAR(50) DEFAULT 'subscribed' NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
--     PRIMARY KEY (client_id, mailing_list_name)
-- );
--
-- CREATE INDEX IF NOT EXISTS idx_mls_list_name ON mailing_list_subscriptions(mailing_list_name);
--
-- INSERT INTO mailing_lists (name, description) VALUES
-- ('TanStackFormNewsletter', 'Default customer newsletter campaign list.'),
-- ('ApexWeeklyDigest', 'Weekly executive summaries and updates.')
-- ON CONFLICT (name) DO NOTHING;
