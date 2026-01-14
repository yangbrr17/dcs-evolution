-- Add priority and risk analysis fields to alarms table
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 4);
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS category text DEFAULT 'process';
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 50;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS response_deadline timestamptz;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS escalated boolean DEFAULT false;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS root_cause_tag_ids text[];

-- Add index for priority-based sorting
CREATE INDEX IF NOT EXISTS idx_alarms_priority_risk ON alarms (priority ASC, risk_score DESC, created_at ASC) WHERE acknowledged = false;

-- Add index for escalation queries
CREATE INDEX IF NOT EXISTS idx_alarms_escalated ON alarms (escalated) WHERE acknowledged = false AND escalated = true;