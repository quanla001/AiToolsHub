package com.doantotnghiep.aitoolshub.controller;

import com.doantotnghiep.aitoolshub.entity.*;
import com.doantotnghiep.aitoolshub.enums.ElevenLabsVoice;
import com.doantotnghiep.aitoolshub.repository.*;
import com.doantotnghiep.aitoolshub.service.*;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tools")
public class ToolController implements ToolAPI {

    private static final Logger logger = LoggerFactory.getLogger(ToolController.class);

    private final TextToImageService textToImageService;
    private final ChatbotService chatbotService;
    private final TextToSpeechService textToSpeechService;
    private final TextToMusicService textToMusicService;
    private final OcrService ocrService;
    private final ChatbotHistoryRepository chatbotHistoryRepository;
    private final ImageHistoryRepository imageHistoryRepository;
    private final TextToSpeechHistoryRepository textToSpeechHistoryRepository;
    private final SoundHistoryRepository soundHistoryRepository;
    private final UserRepository userRepository;
    private final Storage storage;

    public ToolController(
            TextToImageService textToImageService,
            ChatbotService chatbotService,
            TextToSpeechService textToSpeechService,
            TextToMusicService textToMusicService,
            OcrService ocrService,
            ChatbotHistoryRepository chatbotHistoryRepository,
            ImageHistoryRepository imageHistoryRepository,
            TextToSpeechHistoryRepository textToSpeechHistoryRepository,
            SoundHistoryRepository soundHistoryRepository,
            UserRepository userRepository,
            Storage storage) {
        this.textToImageService = textToImageService;
        this.chatbotService = chatbotService;
        this.textToSpeechService = textToSpeechService;
        this.textToMusicService = textToMusicService;
        this.ocrService = ocrService;
        this.chatbotHistoryRepository = chatbotHistoryRepository;
        this.imageHistoryRepository = imageHistoryRepository;
        this.textToSpeechHistoryRepository = textToSpeechHistoryRepository;
        this.soundHistoryRepository = soundHistoryRepository;
        this.userRepository = userRepository;
        this.storage = storage;
    }

    @Override
    public Mono<ResponseEntity<byte[]>> callModel1Api(@RequestBody Map<String, Object> payload) {
        return textToImageService.callModel1Api(payload)
                .map(imageData -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(imageData))
                .onErrorResume(e -> {
                    logger.error("Error in model1 API: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(("{\"error\": \"" + e.getMessage() + "\"}").getBytes()));
                });
    }

    @Override
    public Mono<ResponseEntity<byte[]>> callModel2Api(@RequestBody Map<String, Object> payload) {
        return textToImageService.callModel2Api(payload)
                .map(imageData -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(imageData))
                .onErrorResume(e -> {
                    logger.error("Error in model2 API: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(("{\"error\": \"" + e.getMessage() + "\"}").getBytes()));
                });
    }

    @Override
    public Mono<ResponseEntity<Map<String, String>>> callChatbot(@RequestBody Map<String, Object> request) {
        if (request == null || request.isEmpty()) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Request body cannot be empty")));
        }
        if (!request.containsKey("messages") || !request.containsKey("conversationId")) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Fields 'messages' and 'conversationId' are required")));
        }
        return chatbotService.callChatbotApi(request)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Chatbot API error: " + e.getMessage()))));
    }

    @Override
    public Mono<ResponseEntity<byte[]>> useTextToSpeech(@RequestBody Map<String, Object> request) {
        String input = (String) request.get("input");
        String voice = (String) request.get("voice");
        Double speed = request.get("speed") != null ? Double.parseDouble(request.get("speed").toString()) : 1.0;
        Double stability = request.get("stability") != null ? Double.parseDouble(request.get("stability").toString()) : 0.5;
        Double similarity = request.get("similarity") != null ? Double.parseDouble(request.get("similarity").toString()) : 0.75;

        if (input == null || input.isBlank()) {
            return Mono.just(ResponseEntity.badRequest()
                    .body("Input text cannot be empty".getBytes()));
        }
        if (voice == null || voice.isBlank()) {
            return Mono.just(ResponseEntity.badRequest()
                    .body("Voice option is required".getBytes()));
        }

        ElevenLabsVoice voiceEnum;
        try {
            voiceEnum = ElevenLabsVoice.valueOf(voice.trim().replace(" ", "_").toUpperCase());
        } catch (IllegalArgumentException e) {
            return Mono.just(ResponseEntity.badRequest()
                    .body("Invalid voice option".getBytes()));
        }

        return textToSpeechService.callTextToSpeechApi(input, voiceEnum, speed, stability, similarity)
                .map(audioData -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("audio/mp3"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tts_output.mp3")
                        .body(audioData))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(("{\"error\": \"" + e.getMessage() + "\"}").getBytes())));
    }

    @Override
    public Mono<ResponseEntity<byte[]>> useTextToMusic(@RequestBody Map<String, Object> payload) {
        String input = (String) payload.get("text");
        if (input == null || input.isBlank()) {
            return Mono.just(ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\": \"Input text cannot be empty\"}".getBytes()));
        }

        Double durationSeconds = payload.get("durationSeconds") != null ?
                Double.parseDouble(payload.get("durationSeconds").toString()) : null;
        Double promptInfluence = payload.get("promptInfluence") != null ?
                Double.parseDouble(payload.get("promptInfluence").toString()) : null;

        return textToMusicService.callTextToMusicApi(input, durationSeconds, promptInfluence)
                .map(audioData -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("audio/mp3"))
                        .body(audioData))
                .onErrorResume(e -> {
                    logger.error("Error in text-to-music: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(("{\"error\": \"" + e.getMessage() + "\"}").getBytes()));
                });
    }

    @Override
    public Mono<ResponseEntity<Map<String, String>>> useOcr(@RequestParam("file") MultipartFile file) {
        try {
            return ocrService.callOcrApi(file.getBytes())
                    .map(ResponseEntity::ok)
                    .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", e.getMessage()))));
        } catch (IOException e) {
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to read file: " + e.getMessage())));
        }
    }

    @Override
    public ResponseEntity<?> getChatbotHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            List<ChatbotHistory> histories = chatbotHistoryRepository.findByUserOrderByTimestampAsc(user);
            return ResponseEntity.ok(histories);
        } catch (Exception e) {
            logger.error("Error fetching chatbot history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch chatbot history"));
        }
    }

    @Override
    public ResponseEntity<?> deleteChatbotHistory(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            ChatbotHistory history = chatbotHistoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("History not found: " + id));
            if (!history.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Unauthorized to delete this history"));
            }
            deleteGcsFile(history.getGcsPath());
            chatbotHistoryRepository.delete(history);
            return ResponseEntity.ok(Map.of("message", "Chat history deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting chatbot history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to delete chat history: " + e.getMessage()));
        }
    }

    @Override
    public ResponseEntity<?> getImageHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            return ResponseEntity.ok(imageHistoryRepository.findByUserOrderByCreatedAtDesc(user));
        } catch (Exception e) {
            logger.error("Error fetching image history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch image history"));
        }
    }

    @Override
    public ResponseEntity<?> deleteImageHistory(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            ImageHistory imageHistory = imageHistoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image not found: " + id));
            if (!imageHistory.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Unauthorized to delete this image"));
            }
            deleteGcsFile(imageHistory.getGcsPath());
            imageHistoryRepository.delete(imageHistory);
            return ResponseEntity.ok(Map.of("message", "Image deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting image: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to delete image: " + e.getMessage()));
        }
    }

    @Override
    public ResponseEntity<?> getTtsHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            return ResponseEntity.ok(textToSpeechHistoryRepository.findByUserOrderByCreatedAtDesc(user));
        } catch (Exception e) {
            logger.error("Error fetching TTS history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch TTS history"));
        }
    }

    @Override
    public ResponseEntity<?> deleteTtsHistory(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            TextToSpeechHistory history = textToSpeechHistoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("History not found: " + id));
            if (!history.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Unauthorized to delete this history"));
            }
            deleteGcsFile(history.getGcsPath());
            textToSpeechHistoryRepository.delete(history);
            return ResponseEntity.ok(Map.of("message", "TTS history deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting TTS history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to delete TTS history: " + e.getMessage()));
        }
    }

    @Override
    public ResponseEntity<?> getSoundHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            return ResponseEntity.ok(soundHistoryRepository.findByUserOrderByCreatedAtDesc(user));
        } catch (Exception e) {
            logger.error("Error fetching sound history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch sound history"));
        }
    }

    @Override
    public ResponseEntity<?> deleteSoundHistory(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            SoundHistory soundHistory = soundHistoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Sound history not found: " + id));
            if (!soundHistory.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Unauthorized to delete this sound history"));
            }
            deleteGcsFile(soundHistory.getGcsPath());
            soundHistoryRepository.delete(soundHistory);
            return ResponseEntity.ok(Map.of("message", "Sound history deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting sound history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to delete sound history: " + e.getMessage()));
        }
    }

    private void deleteGcsFile(String gcsPath) {
        if (gcsPath != null && !gcsPath.isBlank()) {
            BlobId blobId = BlobId.of("aitoolhub", gcsPath.replace("gs://aitoolhub/", ""));
            storage.delete(blobId);
        }
    }
}