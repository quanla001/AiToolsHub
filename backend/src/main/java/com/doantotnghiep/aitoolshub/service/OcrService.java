package com.doantotnghiep.aitoolshub.service;

import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class OcrService {

    public Mono<Map<String, String>> callOcrApi(byte[] imageBytes) {
        if (imageBytes == null || imageBytes.length == 0) {
            return Mono.error(new RuntimeException("File is empty or null!"));
        }

        try (ImageAnnotatorClient vision = ImageAnnotatorClient.create()) {
            ByteString imgBytes = ByteString.copyFrom(imageBytes);
            Image img = Image.newBuilder().setContent(imgBytes).build();

            Feature feature = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .setImage(img)
                    .addFeatures(feature)
                    .build();

            BatchAnnotateImagesResponse response = vision.batchAnnotateImages(List.of(request));
            List<AnnotateImageResponse> responses = response.getResponsesList();

            String extractedText = "";

            for (AnnotateImageResponse res : responses) {
                if (res.hasError()) {
                    return Mono.error(
                            new RuntimeException("Error: " + res.getError().getMessage()));
                }
                if (!res.getTextAnnotationsList().isEmpty()) {
                    extractedText = res.getTextAnnotationsList().get(0).getDescription();
                    break;
                }
            }

            Map<String, String> result = new HashMap<>();
            result.put("extractedText", extractedText);
            return Mono.just(result);

        } catch (IOException e) {
            return Mono.error(new RuntimeException("Failed to process image: " + e.getMessage()));
        }
    }
}
