package com.zaid.patel.AI_Email_Assistant.Repository;

import com.zaid.patel.AI_Email_Assistant.Entity.Formats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FormatsRepository extends JpaRepository<Formats, UUID> {
    List<Formats> findByUserId(UUID userId);
    List<Formats> findByUserIdAndMode(UUID userId, String mode);
}
