package com.doantotnghiep.aitoolshub.service;

import com.doantotnghiep.aitoolshub.JWT.JwtUtil;
import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.enums.Role;
import com.doantotnghiep.aitoolshub.repository.UserRepository;
import java.text.Normalizer;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    // Đăng ký tài khoản truyền thống
    public String register(User user) {
        try {
            // Check if email already exists
            Optional<User> existingUserByEmail = userRepository.findByEmail(user.getEmail());
            if (existingUserByEmail.isPresent()) {
                throw new RuntimeException("Registration failed: Email already in use!");
            }

            // Check if username already exists
            Optional<User> existingUserByUsername = userRepository.findByUsername(user.getUsername());
            if (existingUserByUsername.isPresent()) {
                throw new RuntimeException("Registration failed: Username already in use!");
            }

            // Encode password and set role
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRole(Role.USER);
            userRepository.save(user);

            // Return success message with token
            return "Registration successful! " + jwtUtil.generateToken(user.getUsername());
        } catch (RuntimeException e) {
            // Ném lại exception để GlobalExceptionHandler xử lý
            throw e;
        }
    }

    public String authenticate(String email, String password) {
        try {
            System.out.println("Authenticating email: " + email);
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            System.out.println("Authentication successful for email: " + user.getEmail());
            return jwtUtil.generateToken(user.getEmail());
        } catch (Exception e) {
            System.out.println("Authentication failed: " + e.getMessage());
            throw new RuntimeException("Invalid email or password");
        }
    }

    public String processOAuth2User(String email, String name) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
        } else {
            user = new User();
            user.setEmail(email);
            user.setUsername(normalizeUsername(name));
            user.setProvider("google");
            String randomPassword = UUID.randomUUID().toString();
            user.setPassword(passwordEncoder.encode(randomPassword));
            user.setRole(Role.USER);
            userRepository.save(user);
        }

        return jwtUtil.generateToken(user.getEmail());
    }

    private String normalizeUsername(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
        if (normalized.length() > 30) {
            normalized = normalized.substring(0, 30);
        }
        String baseUsername = normalized;
        int count = 0;
        while (userRepository.existsByUsername(normalized)) {
            count++;
            normalized = baseUsername + count;
        }
        return normalized;
    }
}