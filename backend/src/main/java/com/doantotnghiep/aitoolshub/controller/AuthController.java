package com.doantotnghiep.aitoolshub.controller;

import com.doantotnghiep.aitoolshub.model.LoginRequest;
import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.service.AuthService;
import com.doantotnghiep.aitoolshub.service.ForgotPasswordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    @Autowired
    private ForgotPasswordService forgotPasswordService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> register(@RequestBody User user) {
        String token = authService.register(user); // Gọi service và để exception được ném ra
        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully.");
        response.put("token", token);
        response.put("username", user.getUsername()); // ✅ Ensure `username` is included correctly
        return ResponseEntity.ok(response);
    }


    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest request) {
        try {
            System.out.println("Processing login for email: " + request.getEmail());
            String token = authService.authenticate(request.getEmail(), request.getPassword());
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("email", request.getEmail());
            System.out.println("Login success. Returning response: " + response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, String>> getCurrentUser(Authentication authentication) {
        Map<String, String> response = new HashMap<>();
        if (authentication.getPrincipal() instanceof OAuth2User oAuth2User) {
            response.put("loginType", "Google");
            response.put("email", oAuth2User.getAttribute("email"));
        } else {
            response.put("loginType", "Email/Password");
            response.put("email", authentication.getName());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            forgotPasswordService.sendResetPasswordEmail(email);
            Map<String, String> response = new HashMap<>();
            response.put("message", "The email to reset the password has been sent. Please check the mailbox.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestParam String token, @RequestBody Map<String, String> request) {
        try {
            String newPassword = request.get("newPassword");
            forgotPasswordService.resetPassword(token, newPassword);
            Map<String, String> response = new HashMap<>();
            response.put("message", "The password has been reset successfully.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}