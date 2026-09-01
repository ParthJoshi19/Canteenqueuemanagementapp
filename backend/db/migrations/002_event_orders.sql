CREATE TABLE IF NOT EXISTS event_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255) NOT NULL,
  attendees_count INTEGER NOT NULL DEFAULT 1,
  contact_name VARCHAR(120) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  special_instructions TEXT NOT NULL DEFAULT '',
  total_price NUMERIC(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_orders_user_id ON event_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_event_orders_event_date ON event_orders(event_date);
CREATE INDEX IF NOT EXISTS idx_event_orders_status ON event_orders(status);
