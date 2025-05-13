package com.doantotnghiep.aitoolshub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "image_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "gcs_path", nullable = false)
    private String gcsPath;

    @Column(name = "image_url", nullable = false) // Thêm cột image_url
    private String imageUrl;

    @Column(nullable = false)
    private String modelUsed;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}