package com.doantotnghiep.aitoolshub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chatbot_history")
public class ChatbotHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String input;

    @Column(columnDefinition = "TEXT")
    private String response;

    private LocalDateTime timestamp;

    @Column(name = "gcs_path")
    private String gcsPath;

    @Column(name = "conversation_id")
    private String conversationId; // New field to group messages

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}