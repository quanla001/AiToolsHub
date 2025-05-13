package com.doantotnghiep.aitoolshub.service;

import com.doantotnghiep.aitoolshub.entity.ChatbotHistory;
import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.repository.ChatbotHistoryRepository;
import com.doantotnghiep.aitoolshub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ChatbotService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ChatbotService.class);

    private final WebClient webClient;
    private final GcsService gcsService;
    private final ChatbotHistoryRepository chatbotHistoryRepository;
    private final UserRepository userRepository;
    private final String apiKey;
    private final String apiUrl;

    public ChatbotService(
            WebClient.Builder webClientBuilder,
            GcsService gcsService,
            ChatbotHistoryRepository chatbotHistoryRepository,
            UserRepository userRepository,
            @Value("${google.api.key}") String apiKey,
            @Value("${google.models.gemini.url}") String apiUrl) {
        this.webClient = webClientBuilder.baseUrl(apiUrl).build();
        this.gcsService = gcsService;
        this.chatbotHistoryRepository = chatbotHistoryRepository;
        this.userRepository = userRepository;
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
    }

    public Mono<Map<String, String>> callChatbotApi(Map<String, Object> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        String conversationId = (String) request.get("conversationId");
        if (conversationId == null || conversationId.isBlank()) {
            throw new IllegalArgumentException("conversationId is required");
        }

        List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
        if (messages == null || messages.isEmpty()) {
            throw new IllegalArgumentException("Messages are required");
        }

        Map<String, Object> payload = Map.of(
                "contents", messages.stream().map(message -> Map.of(
                        "role", message.get("role").equals("user") ? "user" : "model",
                        "parts", List.of(Map.of("text", message.get("text")))
                )).toList(),
                "generationConfig", Map.of(
                        "temperature", 0.5,
                        "maxOutputTokens", 1500
                )
        );

        return webClient.post()
                .uri(apiUrl + "?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    String extractedText = extractTextFromResponse(response);
                    String input = messages.get(messages.size() - 1).get("text").toString();

                    ChatbotHistory history = new ChatbotHistory();
                    history.setInput(input);
                    history.setResponse(extractedText);
                    history.setTimestamp(LocalDateTime.now());
                    history.setUser(user);
                    history.setConversationId(conversationId);

                    String gcsPath = gcsService.uploadFile(
                            "chatbot/" + user.getId() + "/" + conversationId + "/" + System.currentTimeMillis() + ".txt",
                            extractedText.getBytes()
                    );
                    history.setGcsPath(gcsPath);

                    chatbotHistoryRepository.save(history);

                    return Map.of(
                            "extractedText", extractedText,
                            "conversationId", conversationId,
                            "id", history.getId().toString()
                    );
                })
                .onErrorResume(e -> Mono.just(Map.of("extractedText", "Chatbot API Error: " + e.getMessage())));
    }

    private String extractTextFromResponse(Map response) {
        String extractedText = "No response from AI";
        try {
            if (response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    if (content != null && content.containsKey("parts")) {
                        List<Map<String, String>> parts = (List<Map<String, String>>) content.get("parts");
                        if (!parts.isEmpty()) {
                            extractedText = parts.get(0).get("text");
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error extracting text from response: {}", e.getMessage());
        }
        return extractedText;
    }
}