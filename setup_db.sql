-- Remove unique constraint from reservations table
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_reserved_date_key;

-- Function to check for overlapping reservations
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE reserved_date = NEW.reserved_date
    AND id != NEW.id
    AND (
      (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
      (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
      (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Time slot overlaps with an existing reservation.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check overlap before insert or update
DROP TRIGGER IF EXISTS check_overlap_trigger ON reservations;
CREATE TRIGGER check_overlap_trigger
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION check_reservation_overlap();
