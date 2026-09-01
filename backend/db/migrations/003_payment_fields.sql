-- Add payment columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' 
CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'cash' 
CHECK (payment_method IN ('stripe_card', 'stripe_upi', 'cash')),
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Add payment columns to event_orders table
ALTER TABLE event_orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' 
CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'cash' 
CHECK (payment_method IN ('stripe_card', 'stripe_upi', 'cash')),
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_orders_payment_status ON event_orders(payment_status);
