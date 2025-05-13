package com.doantotnghiep.aitoolshub.entity;

import com.doantotnghiep.aitoolshub.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = true)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(length = 512)
    private String refreshToken;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isVerified;

    @Column
    private String lastLoginIP;

    @Column
    private LocalDateTime lastLoginAt;

    @Column
    private String provider;

    @Column(name = "reset_token") // Thêm field này
    private String resetToken;
}
