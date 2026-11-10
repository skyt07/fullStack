-- My Notes – MySQL schema (my_notes_db)
CREATE DATABASE IF NOT EXISTS my_notes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE my_notes_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    email VARCHAR(255) NOT NULL UNIQUE, 
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    hashed_password VARCHAR(255) NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS folders (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL, 
    name VARCHAR(255) NOT NULL, 
    color VARCHAR(20) NOT NULL DEFAULT 'blue', 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    CONSTRAINT fk_folder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, 
    INDEX idx_folder_user (user_id));

CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL, 
    folder_id INT NULL, 
    title VARCHAR(500) NOT NULL DEFAULT 'Untitled', 
    content TEXT NOT NULL, 
    color VARCHAR(20) NOT NULL DEFAULT 'yellow', 
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE, 
    is_archived BOOLEAN NOT NULL DEFAULT FALSE, 
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, 
    CONSTRAINT fk_note_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL, 
    INDEX idx_note_user (user_id), 
    INDEX idx_note_updated (updated_at));

CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL, 
    note_id INT NULL, 
    title VARCHAR(500) NOT NULL, 
    remind_at DATETIME NOT NULL, 
    is_completed BOOLEAN NOT NULL DEFAULT FALSE, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    CONSTRAINT fk_rem_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, 
    CONSTRAINT fk_rem_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL, 
    INDEX idx_rem_user (user_id), 
    INDEX idx_rem_at (remind_at));

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL UNIQUE, 
    theme VARCHAR(10) DEFAULT 'light', 
    notifications_enabled BOOLEAN DEFAULT TRUE, 
    default_note_color VARCHAR(20) DEFAULT 'yellow', 
    CONSTRAINT fk_pref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
