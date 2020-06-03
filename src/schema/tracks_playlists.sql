CREATE TABLE IF NOT EXISTS tracks_playlists (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    track_id INT NOT NULL,
    playlist_id INT NOT NULL,
    
    FOREIGN KEY track_id REFERENCES tracks(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    
    FOREIGN KEY playlist_id REFERENCES playlists(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
