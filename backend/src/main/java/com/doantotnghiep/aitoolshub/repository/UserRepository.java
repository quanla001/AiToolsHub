package com.doantotnghiep.aitoolshub.repository;

import com.doantotnghiep.aitoolshub.entity.User;
import org.springframework.data.domain.Example;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @EntityGraph(attributePaths = {"role"}, type = EntityGraph.EntityGraphType.LOAD)
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByResetToken(String resetToken);

    boolean existsByUsername(String username);
}