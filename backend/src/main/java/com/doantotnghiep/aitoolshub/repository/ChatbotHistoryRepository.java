package com.doantotnghiep.aitoolshub.repository;

import com.doantotnghiep.aitoolshub.entity.ChatbotHistory;
import com.doantotnghiep.aitoolshub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatbotHistoryRepository extends JpaRepository<ChatbotHistory, Long> {
    List<ChatbotHistory> findByUserOrderByTimestampAsc(User user);
}