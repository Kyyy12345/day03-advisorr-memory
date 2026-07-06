package com.study.day03advisorrmemory;

import com.study.day03advisorrmemory.advisor.AdvisorA;
import com.study.day03advisorrmemory.advisor.CallCounterAdvisor;
import com.study.day03advisorrmemory.advisor.MaxCharLengthAdvisor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SafeGuardAdvisor;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiService {

    private final ChatClient chatClient;
    private final CallCounterAdvisor callCounterAdvisor;
    private final ChatMemory chatMemory;

    public AiService(ChatClient.Builder builder, CallCounterAdvisor callCounterAdvisor,
                     @Qualifier("inMemoryChatMemory") ChatMemory chatMemory) {
        this.callCounterAdvisor = callCounterAdvisor;
        this.chatClient = builder
                .defaultSystem("""
                        당신은 사내 개발팀을 돕는 AI assistant이다.
                        정중하고, 간결한 한국어로 답변하시오.
                        """)
                .defaultAdvisors(new MaxCharLengthAdvisor(), new SafeGuardAdvisor(List.of("계좌번호", "폭탄", "천안문"),
                        "해당질문은 민감한 컨텐츠 용청입니다. 응답 할 수 없습니다.", Ordered.HIGHEST_PRECEDENCE) ,
                        new SimpleLoggerAdvisor()) // 내장 advisor

                .build();
        this.chatMemory = chatMemory;
    }

    public String ask(String question) {
        return chatClient.prompt()
                .advisors(callCounterAdvisor
                , MessageChatMemoryAdvisor.builder(chatMemory).build())
                .user(question)
                .call()
                .content();
    }
}
