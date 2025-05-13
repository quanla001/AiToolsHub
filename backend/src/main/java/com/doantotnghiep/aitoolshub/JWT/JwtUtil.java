package com.doantotnghiep.aitoolshub.JWT;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretKeyString;

    private SecretKey signingKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @PostConstruct
    public void init() {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKeyString));
    }

    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email) // Sử dụng email làm subject
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public String extractEmail(String token) { // Đổi tên để rõ ràng
        JwtParser parser = Jwts.parser()
                .verifyWith(signingKey)
                .build();
        Claims claims = parser.parseSignedClaims(token).getPayload();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            System.err.println("Token validation error: " + e.getMessage());
            return false;
        }
    }
}