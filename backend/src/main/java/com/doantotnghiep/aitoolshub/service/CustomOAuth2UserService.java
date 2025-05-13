package com.doantotnghiep.aitoolshub.service;

import com.doantotnghiep.aitoolshub.entity.CustomOAuth2User;
import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.enums.Role;
import com.doantotnghiep.aitoolshub.repository.UserRepository;
import java.util.Map;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String provider = userRequest.getClientRegistration().getRegistrationId();

        String email;
        String name;

        if ("github".equals(provider)) {
            email = oAuth2User.getAttribute("email");
            name = oAuth2User.getAttribute("login");
            if (email == null) {
                email = name + "@github.com";
            }
        } else { // Google
            email = oAuth2User.getAttribute("email");
            name = oAuth2User.getAttribute("name");
        }

        if (email == null) {
            throw new RuntimeException("Email not found from OAuth2 provider");
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isEmpty()) {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setProvider(provider);
            newUser.setPassword(UUID.randomUUID().toString());
            newUser.setUsername(normalizeUsername(name));
            newUser.setRole(Role.USER);
            userRepository.save(newUser);
        }

        return new CustomOAuth2User(Map.of("email", email, "name", name), email);
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