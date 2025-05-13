package com.doantotnghiep.aitoolshub.service;

import com.doantotnghiep.aitoolshub.JWT.JwtUtil;
import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class ForgotPasswordService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private JwtUtil jwtUtil;

    // Gửi email reset mật khẩu
    public void sendResetPasswordEmail(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("The email does not exist in the system.");
        }

        User user = userOptional.get();
        String resetToken = UUID.randomUUID().toString(); // Tạo token ngẫu nhiên
        user.setResetToken(resetToken); // Lưu token vào entity User (cần thêm field resetToken vào entity User)
        userRepository.save(user);

        // Gửi email
        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken; // Link frontend để reset
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Reset Password Request");
        message.setText("To reset your password, please click on the following link: " + resetLink);

        mailSender.send(message);
    }

    // Xử lý reset mật khẩu
    public void resetPassword(String token, String newPassword) {
        Optional<User> userOptional = userRepository.findByResetToken(token);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Invalid or expired tokens.");
        }

        User user = userOptional.get();
        user.setPassword(passwordEncoder.encode(newPassword)); // Mã hóa mật khẩu mới
        user.setResetToken(null); // Xóa token sau khi reset
        userRepository.save(user);
    }
}