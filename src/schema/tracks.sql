CREATE TABLE IF NOT EXISTS tracks (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    artist VARCHAR(255) NOT NULL
);
