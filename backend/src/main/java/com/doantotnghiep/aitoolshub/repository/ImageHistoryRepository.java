package com.doantotnghiep.aitoolshub.repository;

import com.doantotnghiep.aitoolshub.entity.ImageHistory;
import com.doantotnghiep.aitoolshub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImageHistoryRepository extends JpaRepository<ImageHistory, Long> {
    List<ImageHistory> findByUser(User user);

    List<ImageHistory> findByUserOrderByCreatedAtDesc(User user);
}