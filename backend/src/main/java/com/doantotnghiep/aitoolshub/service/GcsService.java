package com.doantotnghiep.aitoolshub.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GcsService {

    @Autowired
    private Storage storage;

    @Value("${gcs.bucket}")
    private String bucketName;

    public String uploadFile(String fileName, byte[] content) {
        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).build();
        storage.create(blobInfo, content);
        return String.format("gs://%s/%s", bucketName, fileName);
    }
}