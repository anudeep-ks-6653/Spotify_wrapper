package com.spotify.wrapper.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(SpotifyApiException.class)
    public ResponseEntity<Map<String, Object>> handleSpotifyApiException(SpotifyApiException e) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("status", e.getStatusCode());
        payload.put("message", e.getMessage());
        return ResponseEntity.status(e.getStatusCode()).body(payload);
    }
}
