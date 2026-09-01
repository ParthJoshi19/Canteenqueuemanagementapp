-- Migration 004: Support Razorpay payment methods for orders and event_orders
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop existing check constraints on payment_method for orders table
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
          AND contype = 'c' 
          AND pg_get_constraintdef(oid) LIKE '%payment_method%'
    ) LOOP
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;

    -- Drop existing check constraints on payment_method for event_orders table
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'event_orders'::regclass 
          AND contype = 'c' 
          AND pg_get_constraintdef(oid) LIKE '%payment_method%'
    ) LOOP
        EXECUTE 'ALTER TABLE event_orders DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Add updated check constraints allowing Razorpay payment methods
ALTER TABLE orders 
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('razorpay_upi', 'razorpay_card', 'razorpay_netbanking', 'razorpay', 'cash', 'stripe_card', 'stripe_upi'));

ALTER TABLE event_orders 
ADD CONSTRAINT event_orders_payment_method_check 
CHECK (payment_method IN ('razorpay_upi', 'razorpay_card', 'razorpay_netbanking', 'razorpay', 'cash', 'stripe_card', 'stripe_upi'));
