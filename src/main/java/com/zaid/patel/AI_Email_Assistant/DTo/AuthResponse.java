package com.zaid.patel.AI_Email_Assistant.DTo;

public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private String email;
    private String name;
    private String userId;

    public AuthResponse() {}

    public AuthResponse(String accessToken, String tokenType, String email, String name, String userId) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.email = email;
        this.name = name;
        this.userId = userId;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
