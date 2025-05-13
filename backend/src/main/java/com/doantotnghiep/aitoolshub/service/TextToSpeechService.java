package com.doantotnghiep.aitoolshub.service;

import com.doantotnghiep.aitoolshub.entity.TextToSpeechHistory;
import com.doantotnghiep.aitoolshub.entity.User;
import com.doantotnghiep.aitoolshub.enums.ElevenLabsVoice;
import com.doantotnghiep.aitoolshub.repository.TextToSpeechHistoryRepository;
import com.doantotnghiep.aitoolshub.repository.UserRepository;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.SignUrlOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URL;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class TextToSpeechService {

    private final WebClient webClient;
    private final GcsService gcsService;
    private final TextToSpeechHistoryRepository textToSpeechHistoryRepository;
    private final UserRepository userRepository;
    private final Storage storage;
    private final String apiKey;
    private final String apiUrl;
    private final String bucketName;

    public TextToSpeechService(WebClient.Builder webClientBuilder, GcsService gcsService,
            TextToSpeechHistoryRepository textToSpeechHistoryRepository,
            UserRepository userRepository,
            Storage storage,
            @Value("${elevenlabs.api.key}") String apiKey,
            @Value("${elevenlabs.api.url}") String apiUrl,
            @Value("${gcs.bucket}") String bucketName) {
        this.webClient = webClientBuilder
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(configurer -> configurer.defaultCodecs()
                                .maxInMemorySize(10 * 1024 * 1024))
                        .build())
                .build();
        this.gcsService = gcsService;
        this.textToSpeechHistoryRepository = textToSpeechHistoryRepository;
        this.userRepository = userRepository;
        this.storage = storage;
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.bucketName = bucketName;
    }

    public Mono<byte[]> callTextToSpeechApi(String input, ElevenLabsVoice voiceEnum, double speed,
            double stability, double similarity) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        String voiceId = voiceEnum.getVoiceId();
        String url = apiUrl + "/" + voiceId;

        Map<String, Object> payload = Map.of(
                "text", input,
                "model_id", "eleven_turbo_v2_5",
                "voice_settings", Map.of(
                        "speed", speed,
                        "stability", stability,
                        "similarity_boost", similarity
                )
        );

        return webClient.post()
                .uri(url)
                .header("xi-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(byte[].class)
                .map(audioData -> {
                    String filePath =
                            "tts/" + user.getId() + "/" + System.currentTimeMillis() + ".mp3";
                    String gcsPath = gcsService.uploadFile(filePath, audioData);
                    BlobId blobId = BlobId.of(bucketName, filePath);
                    BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                            .build(); // Create BlobInfo from BlobId
                    URL signedUrl;
                    try {
                        signedUrl = storage.signUrl(blobInfo, 7, TimeUnit.DAYS,
                                SignUrlOption.withV4Signature());
                    } catch (Exception e) {
                        throw new RuntimeException(
                                "Failed to generate signed URL for GCS file: " + e.getMessage(), e);
                    }
                    String audioUrl = signedUrl.toString();

                    TextToSpeechHistory history = TextToSpeechHistory.builder()
                            .user(user)
                            .input(input)
                            .voice(voiceEnum.name())
                            .gcsPath(gcsPath)
                            .audioUrl(audioUrl)
                            .speed(speed)
                            .stability(stability)
                            .similarity(similarity)
                            .createdAt(LocalDateTime.now())
                            .build();
                    textToSpeechHistoryRepository.save(history);

                    return audioData;
                });
    }
}