package com.zaid.patel.AI_Email_Assistant.Entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "formats")
public class Formats {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "format_id")
    private UUID formatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String mode;

    @Column(name = "format_data", nullable = false, columnDefinition = "JSONB")
    private String formatData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Formats() {}

    public Formats(Users user, String name, String mode, String formatData) {
        this.user = user;
        this.name = name;
        this.mode = mode;
        this.formatData = formatData;
    }

    public UUID getFormatId() { return formatId; }
    public void setFormatId(UUID formatId) { this.formatId = formatId; }
    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getFormatData() { return formatData; }
    public void setFormatData(String formatData) { this.formatData = formatData; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
