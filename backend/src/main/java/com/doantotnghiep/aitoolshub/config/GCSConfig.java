package com.doantotnghiep.aitoolshub.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class GCSConfig {

    @Value("${gcs.project-id}")
    private String projectId;

    @Value("${gcs.credentials-path:#{null}}")
    private String credentialsPath;

    @Bean
    public Storage storage() throws IOException {
        StorageOptions.Builder builder = StorageOptions.newBuilder().setProjectId(projectId);
        if (credentialsPath != null) {
            builder.setCredentials(GoogleCredentials.fromStream(new FileInputStream(credentialsPath)));
        }
        return builder.build().getService();
    }
}