package com.study.day03advisorrmemory;

import com.study.day03advisorrmemory.advisor.AdvisorA;
import com.study.day03advisorrmemory.advisor.CallCounterAdvisor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

@Service
public class AiService {

    private final ChatClient chatClient;

    public AiService(ChatClient.Builder builder) {

        this.chatClient = builder
                .defaultSystem("""
                        당신은 사내 개발팀을 돕는 AI assistant이다.
                        정중하고, 간결한 한국어로 답변하시오.
                        """)
                .build();
    }

    public String ask(String question) {
        return chatClient.prompt()
                .advisors(new CallCounterAdvisor())
                .user(question)
                .call()
                .content();
    }
}
