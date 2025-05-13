package com.doantotnghiep.aitoolshub.controller;

import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.enums.Role;
import com.doantotnghiep.aitoolshub.repository.UserRepository;
import com.doantotnghiep.aitoolshub.JWT.JwtUtil;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.text.Normalizer;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class OAuthController {
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public OAuthController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> requestBody) {
        String googleToken = requestBody.get("token");
        if (googleToken == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Google token is required"));
        }

        try {
            // Validate Google ID token
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> googleResponse = restTemplate.getForObject(
                    "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + googleToken, Map.class);

            if (googleResponse == null || !googleResponse.containsKey("email")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Google token"));
            }

            String email = googleResponse.get("email").toString();
            String name = googleResponse.get("name") != null ? googleResponse.get("name").toString() : email.split("@")[0];

            Optional<User> userOpt = userRepository.findByEmail(email);
            User user = userOpt.orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setUsername(normalizeUsername(name));
                newUser.setProvider("google");
                newUser.setRole(Role.USER);
                newUser.setPassword(""); // Đặt password rỗng cho Google user
                return userRepository.save(newUser);
            });

            String jwtToken = jwtUtil.generateToken(email);
            return ResponseEntity.ok(Map.of("token", jwtToken, "email", user.getEmail()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal authentication error: " + e.getMessage()));
        }
    }

    @GetMapping("/google")
    @Transactional
    public ResponseEntity<Map<String, String>> googleLogin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof OAuth2User principal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated!"));
        }

        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");

        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required for login!"));
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user = userOptional.orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(normalizeUsername(name));
            newUser.setProvider("google");
            newUser.setPassword(""); // Đặt password rỗng
            newUser.setRole(Role.USER);
            return userRepository.save(newUser);
        });

        String token = jwtUtil.generateToken(email);
        return ResponseEntity.ok(Map.of("token", token, "email", user.getEmail()));
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