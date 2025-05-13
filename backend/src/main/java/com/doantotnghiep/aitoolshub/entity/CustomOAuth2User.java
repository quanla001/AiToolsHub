package com.doantotnghiep.aitoolshub.entity;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {
    private String name;
    private String email;
    private Map<String, Object> attributes;

    public CustomOAuth2User(Map<String, Object> attributes, String email) {
        this.attributes = attributes;
        this.name = (String) attributes.get("name");
        this.email = email;
    }

    @Override
    public String getName() {
        return email; // Trả về email làm principal name
    }

    public String getEmail() {
        return email;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getAttribute(String key) {
        return (String) attributes.get(key);
    }
}