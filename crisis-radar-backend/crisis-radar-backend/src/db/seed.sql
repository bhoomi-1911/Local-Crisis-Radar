-- Sample users (password for all: "password123")
-- Hash generated with bcryptjs, 10 rounds — regenerate via scripts/hash.js if you change it.
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Priya Sharma', 'priya@example.com', '$2b$10$KQFeLT7cioZKvzmnRfNRyeiBRenrkv5MFZ4OyYNyELl69DGHMxqrq', 'citizen'),
  ('BBMP Zone 4', 'bbmp.zone4@example.com', '$2b$10$KQFeLT7cioZKvzmnRfNRyeiBRenrkv5MFZ4OyYNyELl69DGHMxqrq', 'authority'),
  ('Platform Admin', 'admin@example.com', '$2b$10$KQFeLT7cioZKvzmnRfNRyeiBRenrkv5MFZ4OyYNyELl69DGHMxqrq', 'admin');

INSERT INTO reports (type, title, description, latitude, longitude, area, severity, status, reporter_id, verified_by_id) VALUES
  ('flood', 'Waterlogging blocking Sarjapur main stretch', 'Knee-deep water after heavy rain, two lanes impassable.', 12.9008, 77.6842, 'Sarjapur Road', 'critical', 'progress', 1, 2),
  ('power', 'Transformer outage, no power since morning', 'Entire block without power since 7am.', 12.9352, 77.6146, 'Koramangala 5th Block', 'high', 'verified', 1, 2),
  ('roadblock', 'Two-vehicle collision blocking service lane', 'Minor accident, one lane blocked.', 12.9784, 77.6408, 'Indiranagar 100ft Rd', 'moderate', 'reported', 1, NULL),
  ('fire', 'Electrical fire in commercial building', 'Smoke reported from second floor.', 12.9698, 77.7500, 'Whitefield Main Rd', 'critical', 'progress', 1, 2),
  ('infrastructure', 'Large pothole causing two-wheeler falls', 'Deep pothole near signal, three falls this week.', 12.9279, 77.6271, 'HSR Layout Sector 2', 'moderate', 'verified', 1, 2);
