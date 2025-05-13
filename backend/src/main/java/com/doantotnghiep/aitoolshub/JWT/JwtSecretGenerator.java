package com.doantotnghiep.aitoolshub.JWT;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

public class JwtSecretGenerator {
    public static void main(String[] args) {
        SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        String base64Key = Encoders.BASE64.encode(key.getEncoded());
        System.out.println("Base64 Secret Key: " + base64Key);
    }
}
