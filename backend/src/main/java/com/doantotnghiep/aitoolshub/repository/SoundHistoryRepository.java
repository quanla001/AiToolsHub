package com.doantotnghiep.aitoolshub.repository;

import com.doantotnghiep.aitoolshub.entity.SoundHistory;
import com.doantotnghiep.aitoolshub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SoundHistoryRepository extends JpaRepository<SoundHistory, Long> {

    List<SoundHistory> findByUserOrderByCreatedAtDesc(User user);

    List<SoundHistory> findByUserAndPromptContainingIgnoreCase(User user, String prompt);
}