package com.doantotnghiep.aitoolshub.repository;

import com.doantotnghiep.aitoolshub.entity.TextToSpeechHistory;
import com.doantotnghiep.aitoolshub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TextToSpeechHistoryRepository extends JpaRepository<TextToSpeechHistory, Long> {
    List<TextToSpeechHistory> findByUserOrderByCreatedAtDesc(User user);
}