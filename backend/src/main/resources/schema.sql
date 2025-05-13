CREATE TABLE IF NOT EXISTS users (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role VARCHAR(255),
    refresh_token VARCHAR(512),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_loginip VARCHAR(255),
    last_loginat DATETIME,
    provider VARCHAR(255),
    reset_token VARCHAR(255)
    );

CREATE TABLE IF NOT EXISTS text_to_speech_history (
                                                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                      user_id BIGINT NOT NULL,
                                                      input TEXT NOT NULL,
                                                      voice VARCHAR(255) NOT NULL,
    gcs_path VARCHAR(255) NOT NULL,
    audio_url VARCHAR(2048) NOT NULL,
    speed DOUBLE NOT NULL,
    stability DOUBLE NOT NULL,
    similarity DOUBLE NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS image_history (
                                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             user_id BIGINT NOT NULL,
                                             prompt VARCHAR(255) NOT NULL,
    gcs_path VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    model_used VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS chatbot_history (
                                               id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                               input TEXT,
                                               response TEXT,
                                               timestamp DATETIME,
                                               gcs_path VARCHAR(255),
    conversation_id VARCHAR(255),
    user_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS sound_history (
                                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             user_id BIGINT NOT NULL,
                                             prompt VARCHAR(255) NOT NULL,
    gcs_path VARCHAR(255),
    audio_url VARCHAR(2048),
    duration_seconds DOUBLE,
    prompt_influence DOUBLE,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sound_history_user_id (user_id),
    INDEX idx_sound_history_created_at (created_at)
    );