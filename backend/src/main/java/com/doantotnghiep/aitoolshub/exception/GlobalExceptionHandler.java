package com.doantotnghiep.aitoolshub.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        String errorMessage = ex.getMessage(); // Lấy thông báo từ exception
        if (errorMessage != null && !errorMessage.isEmpty()) {
            errorResponse.put("error", errorMessage);
        } else {
            errorResponse.put("error", "Registration failed.");
        }
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
}