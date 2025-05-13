package com.doantotnghiep.aitoolshub.service;

import com.doantotnghiep.aitoolshub.entity.SoundHistory;
import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.repository.SoundHistoryRepository;
import com.doantotnghiep.aitoolshub.repository.UserRepository;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.SignUrlOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.net.URL;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.web.reactive.function.client.ExchangeStrategies;

@Service
public class TextToMusicService {

    private final WebClient webClient;
    private final GcsService gcsService;
    private final SoundHistoryRepository soundHistoryRepository;
    private final UserRepository userRepository;
    private final Storage storage;
    @Value("${elevenlabs.api.key}")
    private String apiKey;
    @Value("${elevenlabs.api.url1}")
    private String apiUrl;
    @Value("${gcs.bucket}")
    private String bucketName;

    public TextToMusicService(WebClient.Builder webClientBuilder, GcsService gcsService,
            SoundHistoryRepository soundHistoryRepository, UserRepository userRepository,
            Storage storage) {
        this.webClient = webClientBuilder
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(configurer -> configurer.defaultCodecs()
                                .maxInMemorySize(10 * 1024 * 1024))
                        .build())
                .build();
        this.gcsService = gcsService;
        this.soundHistoryRepository = soundHistoryRepository;
        this.userRepository = userRepository;
        this.storage = storage;
    }

    public Mono<byte[]> callTextToMusicApi(String input, Double durationSeconds,
            Double promptInfluence) {
        if (apiUrl == null || apiUrl.isBlank()) {
            return Mono.error(new RuntimeException("ElevenLabs API URL is not configured"));
        }

        if (apiKey == null || apiKey.isBlank()) {
            return Mono.error(new RuntimeException("ElevenLabs API key is not configured"));
        }

        if (input == null || input.isBlank()) {
            return Mono.error(new RuntimeException("Input text cannot be empty"));
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        Map<String, Object> payload = Map.of(
                "text", input,
                "duration_seconds", durationSeconds != null ? durationSeconds : 5.0,
                "prompt_influence", promptInfluence != null ? promptInfluence : 0.3
        );

        return webClient.post()
                .uri(apiUrl)
                .header("xi-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    System.err.println(
                                            "ElevenLabs API Error Response: " + errorBody);
                                    return Mono.error(new RuntimeException(
                                            "ElevenLabs API Error: " + errorBody));
                                })
                )
                .bodyToMono(byte[].class)
                .timeout(Duration.ofSeconds(120))
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(5))
                        .filter(throwable -> throwable.getMessage().contains("busy"))
                        .doBeforeRetry(retrySignal ->
                                System.out.println("Retrying ElevenLabs API call... Attempt " +
                                        (retrySignal.totalRetries() + 1))))
                .flatMap(audioData -> {
                    try {
                        String filePath =
                                "sounds/" + user.getId() + "/" + System.currentTimeMillis()
                                        + ".mp3";
                        String gcsPath = gcsService.uploadFile(filePath, audioData);
                        BlobId blobId = BlobId.of(bucketName, filePath);
                        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).build();
                        URL signedUrl;
                        try {
                            signedUrl = storage.signUrl(
                                    blobInfo,
                                    7,
                                    TimeUnit.DAYS,
                                    SignUrlOption.withV4Signature()
                            );
                        } catch (Exception e) {
                            throw new RuntimeException(
                                    "Failed to generate signed URL for GCS file: " + e.getMessage(),
                                    e);
                        }
                        String audioUrl = signedUrl.toString();

                        SoundHistory history = SoundHistory.builder()
                                .user(user)
                                .prompt(input)
                                .audioUrl(audioUrl)
                                .durationSeconds(durationSeconds)
                                .promptInfluence(promptInfluence)
                                .createdAt(LocalDateTime.now())
                                .build();
                        soundHistoryRepository.save(history);

                        return Mono.just(audioData);
                    } catch (Exception e) {
                        System.err.println("Error saving to database: " + e.getMessage());
                        return Mono.error(new RuntimeException(
                                "Failed to save sound history: " + e.getMessage()));
                    }
                })
                .doOnSuccess(response -> {
                    System.out.println(
                            "Received audio file of size: " + response.length + " bytes");
                    System.out.println("First 10 bytes of the response: " + bytesToHex(response));
                })
                .doOnError(e -> {
                    System.err.println("Error calling ElevenLabs API: " + e.getMessage());
                });
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(bytes.length, 10); i++) {
            sb.append(String.format("%02X ", bytes[i]));
        }
        return sb.toString();
    }
}