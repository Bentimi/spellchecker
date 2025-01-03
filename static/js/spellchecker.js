const BOT_IMAGE_URL = "static/images/bot_image.png";

const chatContainer = document.getElementById('chat-container');
const textInput = document.getElementById('text-input');
const checkButton = document.getElementById('check-button');
// const currentTimeElement = document.getElementById('current-time');


// function currentTime() {
//     const now = new Date();
//     const yr = now.getFullYear().toString().padStart(2, '0');
//     const hrs = now.getHours().toString().padStart(2, '0');
//     const mins = now.getMinutes().toString().padStart(2, '0');
//     const secs = now.getSeconds().toString().padStart(2, '0');
//     return `${hrs}:${mins}:${secs} ${yr}`;
// }
// setInterval(() => {
//     currentTimeElement.textContent = currentTime();
// }, 1000);

// Add enter key support
textInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        checkButton.click();
    }
});

// Add this helper function for formatting time
function getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
    return `${time} ${year}`;
}

// Update the appendUserMessage function
function appendUserMessage(text, language) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex justify-end mb-4';
    messageDiv.innerHTML = `
        <div class="flex">
            <div class="mr-2 py-3 px-4 border-2 border-gray-600 rounded-bl-3xl rounded-tr-3xl rounded-tl-xl max-w-[95%] shadow-xl backdrop-blur-lg">
                <div class="space-y-3">
                    <div class="p-4 rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 shadow-lg">
                        <p class="text-white font-medium">${text}</p>
                    </div>
                </div>
                <p class="text-xs text-gray-200 mt-2 flex items-center">
                    <ion-icon name="checkmark-done" class="mr-1"></ion-icon>
                    Language: ${language} • ${getCurrentTime()}
                </p>
            </div>
            <div>
                <p class="bg-gray-500 p-3 rounded-full w-12 h-12 flex justify-center items-center font-extrabold text-white">YOU</p>
            </div>
        </div>
    `;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Update the appendBotMessage function
function appendBotMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex justify-start mb-4';
    
    let content = '';
    if (data.error) {
        content = `
            <div class="p-3 bg-gradient-to-r from-red-600 to-pink-500 rounded-lg text-white">
                Error: ${data.error}
            </div>`;
    } else {
        content = `
            <div class="space-y-3">
                <div class="p-4 rounded-lg bg-gradient-to-r from-gray-600 via-gray-500 to-gray-400 shadow-lg">
                    <p class="text-xs font-bold text-blue-100 mb-2 uppercase tracking-wider flex items-center">
                        <ion-icon name="checkmark-circle" class="mr-1 text-lg"></ion-icon>
                        Corrected Text
                    </p>
                    <p class="text-white font-medium">${data.corrected_text}</p>
                </div>`;

        const hasAnySuggestions = Object.values(data.word_analysis).some(
            analysis => analysis.suggestions && analysis.suggestions.length > 0
        );

        if (hasAnySuggestions) {
            content += `
                <div class="p-4 rounded-lg bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 shadow-lg">
                    <p class="text-xs font-bold text-purple-100 mb-2 uppercase tracking-wider flex items-center">
                        <ion-icon name="bulb" class="mr-1 text-lg"></ion-icon>
                        Suggestions
                    </p>`;
            
            for (const [word, analysis] of Object.entries(data.word_analysis)) {
                if (analysis.suggestions && analysis.suggestions.length > 0) {
                    content += `
                        <div class="mb-3 last:mb-0">
                            <p class="text-sm text-purple-100 mb-1">
                                <span class="font-semibold">${word}</span>
                            </p>
                            <div class="flex flex-wrap gap-2">
                                ${analysis.suggestions.map(s => 
                                    `<span class="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full 
                                            cursor-pointer hover:bg-white/30 transition-colors duration-200"
                                            onclick="applySuggestion('${s}')">${s}</span>`
                                ).join('')}
                            </div>
                        </div>`;
                }
            }
            content += `</div>`;
        }
        content += `</div>`;
    }

    messageDiv.innerHTML = `
        <div class="flex">
            <div>
                <p class="bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-12 h-12 
                            flex items-center justify-center shadow-lg border-2 border-gray-600">
                    <img src="${BOT_IMAGE_URL}" alt="Bot">
                </p>
            </div>
            <div class="ml-2 py-3 px-4 border-2 border-gray-600 rounded-br-3xl rounded-tr-3xl rounded-tl-xl max-w-[95%] shadow-xl backdrop-blur-lg">
                ${content}
                <p class="text-xs text-gray-200 mt-2 flex items-center">
                    <ion-icon name="checkmark-done" class="mr-1"></ion-icon>
                    ${getCurrentTime()}
                </p>
            </div>
        </div>
    `;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function showLoadingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex justify-start mb-4';
    messageDiv.id = 'loading-indicator';
    messageDiv.innerHTML = `
        <div class="flex">
            
            <div class="ml-2 py-2 px-4 rounded-br-3xl rounded-tr-3xl rounded-tl-xl backdrop-blur-lg border-2 border-gray-600">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

checkButton.addEventListener('click', async function() {
    const text = textInput.value.trim();
    const language = document.getElementById('language-select').value;
    
    if (!text) return;

    // Append user message
    appendUserMessage(text, language);
    
    // Clear input immediately
    textInput.value = '';

    // Show loading indicator
    showLoadingIndicator();

    try {
        const response = await fetch('/spell-check/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({
                text: text,
                language: language
            })
        });

        const data = await response.json();
        
        // Remove loading indicator
        removeLoadingIndicator();
        
        // Show response
        appendBotMessage(data);
        
        // Focus back on input
        textInput.focus();
    } catch (error) {
        // Remove loading indicator
        removeLoadingIndicator();
        
        appendBotMessage({ error: error.message });
    }
});

function applySuggestion(suggestion) {
    textInput.value = suggestion;
    textInput.focus();
}

// Add this function to update time
function updateCurrentTime() {
    const timeElement = document.getElementById('current-time');
    const now = new Date();
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    timeElement.textContent = `${time} ${year}`;
}

// Update time every second
setInterval(updateCurrentTime, 1000);

// Initial update
updateCurrentTime();