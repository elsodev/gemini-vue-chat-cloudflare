-- Drop the existing Users table (if needed)
DROP TABLE IF EXISTS Users;

-- Create the Users table with auto-incrementing integer primary key
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
);

-- Update the foreign key references in the Messages and Sessions tables
CREATE TABLE IF NOT EXISTS Messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_message TEXT,
  bot_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users (id)
);

CREATE TABLE IF NOT EXISTS Sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  access_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users (id)
);
