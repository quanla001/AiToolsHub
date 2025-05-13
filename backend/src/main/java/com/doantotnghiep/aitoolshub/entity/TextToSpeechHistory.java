package com.doantotnghiep.aitoolshub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "text_to_speech_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TextToSpeechHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String input;

    @Column(nullable = false)
    private String voice;

    @Column(name = "gcs_path", nullable = false)
    private String gcsPath;

    @Column(name = "audio_url", nullable = false, length = 2048) // Increase length to 2048
    private String audioUrl;

    @Column(nullable = false)
    private double speed;

    @Column(nullable = false)
    private double stability;

    @Column(nullable = false)
    private double similarity;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}