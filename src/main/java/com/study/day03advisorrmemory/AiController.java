package com.study.day03advisorrmemory;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AiController {

    private final AiService aiService;
    private final MemoryChatService memoryChatService;
    private final PersistentChatService persistentChatService;

    public AiController(AiService aiService, MemoryChatService memoryChatService, PersistentChatService persistentChatService) {
        this.aiService = aiService;
        this.memoryChatService = memoryChatService;
        this.persistentChatService = persistentChatService;
    }

    @GetMapping("/ask")
    public String ask(
            @RequestParam String question
            ) {
        return aiService.ask(question);
    }

    @GetMapping("/chat-memory")
    public String chatMemory(@RequestParam String question, @RequestParam String conversationId) {
        return memoryChatService.chat(question, conversationId);
    }

    @GetMapping("/chat-persistent")
    public String chatPersistent(@RequestParam String question, @RequestParam String conversationId) {
        return persistentChatService.chat(question, conversationId);
    }
}
