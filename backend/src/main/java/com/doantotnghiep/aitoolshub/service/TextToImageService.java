package com.doantotnghiep.aitoolshub.service;

import com.doantotnghiep.aitoolshub.entity.ImageHistory;
import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.repository.ImageHistoryRepository;
import com.doantotnghiep.aitoolshub.repository.UserRepository;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class TextToImageService {

    private final WebClient webClient;
    private final GcsService gcsService;
    private final ImageHistoryRepository imageHistoryRepository;
    private final UserRepository userRepository;
    private final String apiKey;
    private final String apiUrlModel1;
    private final String apiUrlModel2;

    private static final int MAX_PROMPT_LENGTH = 1000; // Adjust based on your database column length

    public TextToImageService(WebClient.Builder webClientBuilder, GcsService gcsService,
            ImageHistoryRepository imageHistoryRepository, UserRepository userRepository,
            @Value("${huggingface.api.token}") String apiKey,
            @Value("${huggingface.models.model1.url}") String apiUrlModel1,
            @Value("${huggingface.models.model2.url}") String apiUrlModel2) {
        // Configure HttpClient with a 5-minute timeout
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 300_000) // 5 minutes for connection timeout
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(300, TimeUnit.SECONDS)) // 5 minutes for read timeout
                        .addHandlerLast(new WriteTimeoutHandler(300, TimeUnit.SECONDS))); // 5 minutes for write timeout

        // Build WebClient with the configured HttpClient
        this.webClient = webClientBuilder
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
        this.gcsService = gcsService;
        this.imageHistoryRepository = imageHistoryRepository;
        this.userRepository = userRepository;
        this.apiKey = apiKey;
        this.apiUrlModel1 = apiUrlModel1;
        this.apiUrlModel2 = apiUrlModel2;
    }

    private Mono<byte[]> callModelApi(Map<String, Object> payload, String apiUrl, String modelName) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        String input = (String) payload.get("input");
        // Truncate the prompt if it exceeds the maximum length
        String truncatedPrompt = input.length() > MAX_PROMPT_LENGTH
                ? input.substring(0, MAX_PROMPT_LENGTH) + "..."
                : input;

        if (input.length() > MAX_PROMPT_LENGTH) {
            System.out.println("Prompt truncated from " + input.length() + " to " + MAX_PROMPT_LENGTH + " characters");
        }

        Map<String, Object> hfPayload = Map.of(
                "inputs", input,
                "parameters", Map.of(
                        "negative_prompt", payload.getOrDefault("negativePrompt", ""),
                        "num_inference_steps", payload.getOrDefault("numInferenceSteps", 28)
                ),
                "options", Map.of("wait_for_model", true)
        );

        return webClient.post()
                .uri(apiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(hfPayload)
                .retrieve()
                .bodyToMono(byte[].class)
                .timeout(Duration.ofMinutes(5)) // 5-minute timeout for the entire Mono pipeline
                .flatMap(imageData -> {
                    try {
                        String gcsPath = gcsService.uploadFile(
                                "images/" + user.getId() + "/" + System.currentTimeMillis() + ".jpg",
                                imageData
                        );

                        ImageHistory history = ImageHistory.builder()
                                .user(user)
                                .prompt(truncatedPrompt)
                                .gcsPath(gcsPath)
                                .imageUrl(gcsPath)
                                .modelUsed(modelName)
                                .createdAt(LocalDateTime.now())
                                .build();
                        imageHistoryRepository.save(history);

                        return Mono.just(imageData);
                    } catch (Exception e) {
                        System.err.println("Error saving to database: " + e.getMessage());
                        return Mono.error(new RuntimeException("Failed to save image history: " + e.getMessage()));
                    }
                });
    }

    public Mono<byte[]> callModel1Api(Map<String, Object> payload) {
        return callModelApi(payload, apiUrlModel1, "stable-diffusion-xl-base-1.0");
    }

    public Mono<byte[]> callModel2Api(Map<String, Object> payload) {
        return callModelApi(payload, apiUrlModel2, "stable-diffusion-3.5-large");
    }
}