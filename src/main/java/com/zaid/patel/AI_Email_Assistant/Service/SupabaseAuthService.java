package com.zaid.patel.AI_Email_Assistant.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaid.patel.AI_Email_Assistant.DTo.AuthResponse;
import com.zaid.patel.AI_Email_Assistant.DTo.LoginRequest;
import com.zaid.patel.AI_Email_Assistant.DTo.SignUpRequest;
import com.zaid.patel.AI_Email_Assistant.Entity.Users;
import com.zaid.patel.AI_Email_Assistant.Repository.UsersRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class SupabaseAuthService {

    private final WebClient webClient;
    private final UsersRepository usersRepository;
    private final ObjectMapper objectMapper;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon.key}")
    private String anonKey;

    public SupabaseAuthService(WebClient.Builder webClientBuilder, UsersRepository usersRepository, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.usersRepository = usersRepository;
        this.objectMapper = objectMapper;
    }

    public AuthResponse signUp(SignUpRequest request) {
        Map<String, String> body = Map.of(
                "email", request.getEmail(),
                "password", request.getPassword()
        );

        String responseJson = webClient.post()
                .uri(supabaseUrl + "/auth/v1/signup")
                .header("apikey", anonKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode userNode = root.path("user");
            String userId = userNode.path("id").asText();
            String email = userNode.path("email").asText();
            String accessToken = root.path("access_token").asText();
            String tokenType = root.path("token_type").asText();

            if (usersRepository.findByEmail(email).isEmpty()) {
                Users user = new Users(request.getName(), email, "");
                user.setId(java.util.UUID.fromString(userId));
                usersRepository.save(user);
            }

            return new AuthResponse(accessToken, tokenType, email, request.getName(), userId);
        } catch (Exception e) {
            throw new RuntimeException("Supabase signup failed: " + e.getMessage(), e);
        }
    }

    public AuthResponse signIn(LoginRequest request) {
        Map<String, String> body = Map.of(
                "email", request.getEmail(),
                "password", request.getPassword()
        );

        String responseJson = webClient.post()
                .uri(supabaseUrl + "/auth/v1/token?grant_type=password")
                .header("apikey", anonKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode userNode = root.path("user");
            String userId = userNode.path("id").asText();
            String email = userNode.path("email").asText();
            String accessToken = root.path("access_token").asText();
            String tokenType = root.path("token_type").asText();

            String name = email;
            var localUser = usersRepository.findByEmail(email);
            if (localUser.isPresent()) {
                name = localUser.get().getName();
            }

            return new AuthResponse(accessToken, tokenType, email, name, userId);
        } catch (Exception e) {
            throw new RuntimeException("Supabase signin failed: " + e.getMessage(), e);
        }
    }

    public JsonNode getUser(String accessToken) {
        String responseJson = webClient.get()
                .uri(supabaseUrl + "/auth/v1/user")
                .header("Authorization", "Bearer " + accessToken)
                .header("apikey", anonKey)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            return objectMapper.readTree(responseJson);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get user: " + e.getMessage(), e);
        }
    }
}
