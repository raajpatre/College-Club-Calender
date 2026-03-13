SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    cc.check_clause
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'reservations' AND tc.constraint_type = 'UNIQUE';
