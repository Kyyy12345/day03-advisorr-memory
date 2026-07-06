// Spring AI Workspace App Logic

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chat-input-form');
    const messageInput = document.getElementById('chat-message-input');
    const chatContainer = document.getElementById('chat-messages-container');
    const conversationIdInput = document.getElementById('conversation-id-input');
    const btnGenerateId = document.getElementById('btn-generate-id');
    const activeSessionDisplay = document.getElementById('active-session-display');
    const currentModeBadge = document.getElementById('current-mode-badge');
    const btnClearChat = document.getElementById('btn-clear-chat');
    
    // Mode radio and cards
    const modeRadios = document.querySelectorAll('input[name="api-mode"]');
    const modeCards = document.querySelectorAll('.mode-card');
    const convSection = document.getElementById('conv-section');
    
    // Diagnostics
    const diagUrl = document.getElementById('diag-url');
    const diagStatus = document.getElementById('diag-status');
    const diagTime = document.getElementById('diag-time');
    const diagParams = document.getElementById('diag-params');
    const diagRaw = document.getElementById('diag-raw');
    
    // Preset Buttons
    const presetBtns = document.querySelectorAll('.btn-preset');

    // State Variables
    let currentMode = 'persistent'; // 'persistent', 'memory', or 'ask'
    let conversationId = '';

    // Initialize Application
    init();

    function init() {
        // Generate a random Conversation ID on startup
        generateNewSessionId();
        
        // Setup textarea auto-expand
        messageInput.addEventListener('input', autoExpandTextarea);
        
        // Setup Enter key submission
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatForm.requestSubmit();
            }
        });

        // Form submission
        chatForm.addEventListener('submit', handleFormSubmit);

        // Generate ID Button
        btnGenerateId.addEventListener('click', () => {
            generateNewSessionId();
            appendSystemMessage(`ℹ️ 새 대화 식별자가 생성되었습니다: <strong>${conversationId}</strong>.<br>기존 세션과 메모리는 단절되고 완전히 새로운 대화가 시작됩니다.`);
        });

        // Sync Conversation ID Input manual edits
        conversationIdInput.addEventListener('change', () => {
            let val = conversationIdInput.value.trim();
            if (!val) {
                generateNewSessionId();
            } else {
                conversationId = val;
                activeSessionDisplay.textContent = conversationId;
            }
        });

        // Mode Switch Handler
        modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                switchMode(e.target.value);
            });
        });

        // Preset Click Handler
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-text');
                messageInput.value = text;
                messageInput.focus();
                autoExpandTextarea();
                
                // Immediately submit preset
                chatForm.requestSubmit();
            });
        });

        // Clear Chat
        btnClearChat.addEventListener('click', () => {
            // Keep the first welcome message
            const welcome = chatContainer.querySelector('.system-message');
            chatContainer.innerHTML = '';
            if (welcome) {
                chatContainer.appendChild(welcome);
            }
            appendSystemMessage('🧹 화면이 초기화되었습니다. (데이터베이스의 대화 기록은 지워지지 않으며, 화면만 청소합니다.)');
        });
    }

    // Auto expand height of text area based on content
    function autoExpandTextarea() {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
    }

    // Generate random short ID
    function generateNewSessionId() {
        const randomHex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
        conversationId = `sess-${randomHex}`;
        conversationIdInput.value = conversationId;
        activeSessionDisplay.textContent = conversationId;
    }

    // Handle Endpoint Mode Changes
    function switchMode(newMode) {
        currentMode = newMode;
        
        // Update Card visual classes
        modeCards.forEach(card => card.classList.remove('active'));
        const activeCard = document.getElementById(`card-${newMode}`);
        if (activeCard) activeCard.classList.add('active');

        // Update Header Badge
        currentModeBadge.className = 'badge'; // clear
        
        if (newMode === 'persistent') {
            currentModeBadge.textContent = '💾 Persistent H2 Mode';
            currentModeBadge.classList.add('badge-persistent');
            convSection.style.opacity = '1';
            convSection.style.pointerEvents = 'auto';
        } else if (newMode === 'memory') {
            currentModeBadge.textContent = '💬 In-Memory Mode';
            currentModeBadge.classList.add('badge-memory');
            convSection.style.opacity = '1';
            convSection.style.pointerEvents = 'auto';
        } else {
            currentModeBadge.textContent = '🌐 Stateless (Ask) Mode';
            currentModeBadge.classList.add('badge-ask');
            convSection.style.opacity = '0.4';
            convSection.style.pointerEvents = 'none'; // visually disable session settings for ask mode
        }
        
        appendSystemMessage(`🔄 연결 모드가 <strong>${currentModeBadge.textContent}</strong>(으)로 전환되었습니다.`);
    }

    // Form Submit Handler
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const questionText = messageInput.value.trim();
        if (!questionText) return;

        // Reset Input
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // 1. Add User Bubble
        appendBubble('user', questionText, currentMode);
        
        // 2. Add Typing Placeholder
        const typingEl = appendTypingIndicator();
        scrollToBottom();

        // 3. Construct API details
        let endpoint = '/api/ask';
        let params = { question: questionText };

        if (currentMode === 'memory') {
            endpoint = '/api/chat-memory';
            params.conversationId = conversationId;
        } else if (currentMode === 'persistent') {
            endpoint = '/api/chat-persistent';
            params.conversationId = conversationId;
        }

        const queryString = new URLSearchParams(params).toString();
        const requestUrl = `${endpoint}?${queryString}`;
        
        // Diagnostics: update query params panel
        diagParams.textContent = JSON.stringify(params, null, 2);
        diagUrl.textContent = endpoint;

        const startTime = performance.now();

        try {
            const response = await fetch(requestUrl);
            const duration = (performance.now() - startTime).toFixed(0);
            
            // Remove typing indicator
            typingEl.remove();

            // Update status diagnostics
            diagStatus.textContent = `${response.status} ${response.statusText}`;
            diagStatus.className = `value ${response.ok ? 'success' : 'danger'}`;
            diagTime.textContent = `${duration} ms`;

            const responseText = await response.text();
            diagRaw.textContent = responseText;

            if (response.ok) {
                // Check if response is the SafeGuard block response
                // Day3 default safe response is: "해당 질문은 민감한 컨텐츠 요청입니다. 응답할 수 없습니다."
                const isBlocked = responseText.includes("민감한 컨텐츠") || responseText.includes("차단");
                
                appendBubble('assistant', responseText, currentMode, isBlocked);
            } else {
                appendBubble('assistant', `⚠️ API 호출 에러가 발생했습니다. (HTTP ${response.status})\n서버가 기동되어 있는지, 혹은 구글 API 키 환경변수가 올바르게 주입되었는지 확인해 주세요.`, currentMode, true);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            typingEl.remove();
            
            diagStatus.textContent = 'Connection Error';
            diagStatus.className = 'value danger';
            diagTime.textContent = '-';
            diagRaw.textContent = error.message;

            appendBubble('assistant', `❌ 백엔드 서버 연결 실패!\n서버가 8080 포트에서 실행 중인지 확인하세요.`, currentMode, true);
        }
        
        scrollToBottom();
    }

    // Dynamic UI Builders
    function appendBubble(sender, text, mode, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        if (isError) {
            messageDiv.classList.add('blocked');
        }

        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        avatar.textContent = sender === 'user' ? '👤' : (isError ? '🛡️' : '🤖');

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        
        // Convert linebreaks to HTML breaks
        const formattedText = text.replace(/\n/g, '<br>');
        
        // Add meta tags for assistant responses (shows which engine answered)
        if (sender === 'assistant') {
            let modeLabel = '';
            let modeClass = '';
            if (mode === 'persistent') { modeLabel = 'PERSIST H2'; modeClass = 'p'; }
            else if (mode === 'memory') { modeLabel = 'IN-MEMORY'; modeClass = 'm'; }
            else { modeLabel = 'STATELESS'; modeClass = 'a'; }
            
            bubble.innerHTML = `
                <div style="margin-bottom: 4px;">
                    <span class="bubble-tag ${modeClass}">${modeLabel}</span>
                </div>
                <div>${formattedText}</div>
                <span class="bubble-meta">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
            `;
        } else {
            bubble.innerHTML = `
                <div>${formattedText}</div>
                <span class="bubble-meta">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            `;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function appendSystemMessage(htmlContent) {
        const msg = document.createElement('div');
        msg.className = 'message system-message-inline';
        msg.style.alignSelf = 'center';
        msg.style.fontSize = '11px';
        msg.style.color = 'var(--text-secondary)';
        msg.style.backgroundColor = 'var(--bg-primary)';
        msg.style.border = '1px solid var(--border-color)';
        msg.style.padding = '6px 14px';
        msg.style.borderRadius = '20px';
        msg.style.margin = '4px 0';
        msg.style.boxShadow = 'var(--shadow-sm)';
        msg.innerHTML = htmlContent;
        chatContainer.appendChild(msg);
        scrollToBottom();
    }

    function appendTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'assistant', 'typing-placeholder');

        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        avatar.textContent = '🤖';

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        
        const dots = document.createElement('div');
        dots.classList.add('typing-dots');
        dots.innerHTML = '<span></span><span></span><span></span>';

        bubble.appendChild(dots);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        chatContainer.appendChild(messageDiv);
        return messageDiv;
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});
