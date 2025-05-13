package com.doantotnghiep.aitoolshub.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.util.Map;

@RequestMapping("/api/tools")
public interface ToolAPI {

    @PostMapping(value = "/model1", produces = MediaType.IMAGE_JPEG_VALUE)
    Mono<ResponseEntity<byte[]>> callModel1Api(@RequestBody Map<String, Object> payload);

    @PostMapping(value = "/model2", produces = MediaType.IMAGE_JPEG_VALUE)
    Mono<ResponseEntity<byte[]>> callModel2Api(@RequestBody Map<String, Object> payload);

    @PostMapping("/chatbot")
    Mono<ResponseEntity<Map<String, String>>> callChatbot(@RequestBody Map<String, Object> request);

    @PostMapping("/text-to-speech")
    Mono<ResponseEntity<byte[]>> useTextToSpeech(@RequestBody Map<String, Object> request);

    @PostMapping(value = "/text-to-music", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    Mono<ResponseEntity<byte[]>> useTextToMusic(@RequestBody Map<String, Object> payload);

    @PostMapping(value = "/ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    Mono<ResponseEntity<Map<String, String>>> useOcr(@RequestParam("file") MultipartFile file);

    @GetMapping("/history/chatbot")
    ResponseEntity<?> getChatbotHistory();

    @DeleteMapping("/history/chatbot/{id}")
    ResponseEntity<?> deleteChatbotHistory(@PathVariable Long id);

    @GetMapping("/history/images")
    ResponseEntity<?> getImageHistory();

    @DeleteMapping("/history/images/{id}")
    ResponseEntity<?> deleteImageHistory(@PathVariable Long id);

    @GetMapping("/history/tts")
    ResponseEntity<?> getTtsHistory();

    @DeleteMapping("/history/tts/{id}")
    ResponseEntity<?> deleteTtsHistory(@PathVariable Long id);

    @GetMapping("/history/sounds")
    ResponseEntity<?> getSoundHistory();

    @DeleteMapping("/history/sounds/{id}")
    ResponseEntity<?> deleteSoundHistory(@PathVariable Long id);
}