package com.doantotnghiep.aitoolshub.service;

import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Nếu user đăng nhập bằng Google, bỏ qua mật khẩu
        String password = user.getProvider() != null && user.getProvider().equals("google")
                ? "" // Hoặc một giá trị placeholder
                : user.getPassword();

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(password)
                .roles(user.getRole().name())
                .build();
    }
}