package com.study.day03advisorrmemory.advisor;

// 1. ⚠️ 중요: 기존 java.util.logging.Logger를 지우고, 반드시 아래 두 개의 org.slf4j로 임포트해야 해!
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

@Component // 이제 정상적으로 로거가 생성되므로 @Component를 붙여서 스프링 빈으로 등록해도 잘 작동해!
public class CallCounterAdvisor implements CallAdvisor {

    // 2. 앞에 (Logger) 강제 형변환 하던 부분을 지우고 순수 SLF4J 로거로 변경했어.
    private static final Logger log = LoggerFactory.getLogger(CallCounterAdvisor.class);

    @Override
    public ChatClientResponse adviseCall(ChatClientRequest chatClientRequest, CallAdvisorChain callAdvisorChain) {
        log.info("[전처리] advisorA 호출");
        ChatClientResponse response = callAdvisorChain.nextCall(chatClientRequest);
        log.info("[후처리] advisorA 호출");

        return response;
    }

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE - 1;
    }
}