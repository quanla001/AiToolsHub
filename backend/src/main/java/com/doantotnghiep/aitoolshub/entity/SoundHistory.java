package com.doantotnghiep.aitoolshub.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "sound_history")
public class SoundHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String prompt;

    @Column(name = "gcs_path")
    private String gcsPath;

    @Column(name = "audio_url", length = 2048)
    private String audioUrl;

    @Column
    private Double durationSeconds;

    @Column
    private Double promptInfluence;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}