-- High-concurrency stress test setup for pgbench
-- Mubarak Tijani (ID: 301915100)

DO $$
DECLARE
    v_cust_id BIGINT;
    i         INT;
BEGIN
    SELECT customer_id INTO v_cust_id FROM customers WHERE email = 'p3.alice@lsdb-demo.ng';

    FOR i IN 1..10 LOOP
        INSERT INTO accounts (
            customer_id, account_number, account_kind, account_type, currency, available_balance, status
        )
        VALUES (
            v_cust_id, 'P3-BENCH-' || LPAD(i::text, 3, '0'), 'CUSTOMER', 'CURRENT', 'NGN', 1000000.00, 'ACTIVE'
        )
        ON CONFLICT (account_number) 
        DO UPDATE SET available_balance = 1000000.00;
    END LOOP;
END $$;

DELETE FROM ledger_entries WHERE description LIKE 'pgbench stress%';
DELETE FROM transactions WHERE initiated_by = 'pgbench';

CREATE OR REPLACE FUNCTION lsdb_transfer_bench(
    p_from_acc TEXT,
    p_to_acc   TEXT,
    p_amount   NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    v_from_id BIGINT;
    v_to_id   BIGINT;
    v_min     BIGINT;
    v_max     BIGINT;
    v_bal     NUMERIC(19,2);
    v_tx      BIGINT;
    v_ref     TEXT;
BEGIN
    IF p_from_acc = p_to_acc THEN
        RETURN FALSE;
    END IF;

    SELECT account_id INTO v_from_id FROM accounts WHERE account_number = p_from_acc;
    SELECT account_id INTO v_to_id   FROM accounts WHERE account_number = p_to_acc;

    IF v_from_id IS NULL OR v_to_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Ascending lock order prevents deadlock between concurrent sessions
    v_min := LEAST(v_from_id, v_to_id);
    v_max := GREATEST(v_from_id, v_to_id);
    PERFORM account_id FROM accounts WHERE account_id = v_min FOR UPDATE;
    PERFORM account_id FROM accounts WHERE account_id = v_max FOR UPDATE;

    SELECT available_balance INTO v_bal FROM accounts WHERE account_id = v_from_id;
    IF v_bal < p_amount THEN
        RETURN FALSE;
    END IF;

    UPDATE accounts SET available_balance = available_balance - p_amount WHERE account_id = v_from_id;
    UPDATE accounts SET available_balance = available_balance + p_amount WHERE account_id = v_to_id;

    v_ref := 'TXN-BENCH-' || gen_random_uuid();
    INSERT INTO transactions (
        transaction_ref, transaction_type, status, amount, currency,
        source_account_id, destination_account_id, initiated_by, posted_at
    ) VALUES (
        v_ref, 'TRANSFER', 'POSTED', p_amount, 'NGN',
        v_from_id, v_to_id, 'pgbench', clock_timestamp()
    ) RETURNING transaction_id INTO v_tx;

    INSERT INTO ledger_entries (
        transaction_id, account_id, entry_side, amount, currency, line_number, description
    ) VALUES
        (v_tx, v_from_id, 'DEBIT',  p_amount, 'NGN', 1, 'pgbench stress debit'),
        (v_tx, v_to_id,   'CREDIT', p_amount, 'NGN', 2, 'pgbench stress credit');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
