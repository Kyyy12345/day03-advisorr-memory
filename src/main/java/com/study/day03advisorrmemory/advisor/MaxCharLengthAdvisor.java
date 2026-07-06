package com.study.day03advisorrmemory.advisor;

import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;

public class MaxCharLengthAdvisor implements CallAdvisor {

    public static final String MAX_CHAR_LENGTH = "maxCharLength";
    private int defaultMaxCharLength = 100;
    private int order = 0;

    @Override
    public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
        ChatClientRequest mutatedRequest = augmentPrompt(request);   // 전처리
        return chain.nextCall(mutatedRequest);
    }

    private ChatClientRequest augmentPrompt(ChatClientRequest request) {
        Integer maxCharLength = (Integer) request.context().get(MAX_CHAR_LENGTH);
        int limit = maxCharLength != null ? maxCharLength : this.defaultMaxCharLength;
        Prompt augmented = request.prompt().augmentUserMessage(
                m -> UserMessage.builder().text(m.getText() + " " + limit + "자 이내로 답변해 주세요.").build());
        return request.mutate().prompt(augmented).build();
    }

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
