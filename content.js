let preferredLanguage;

// Function to update preferred language
function updatePreferredLanguage() {
  chrome.storage.sync.get("preferredLanguage", function (data) {
    if (data.preferredLanguage) {
      preferredLanguage = data.preferredLanguage;
      console.log("Preferred language updated:", preferredLanguage);
    }
  });
}

// Initial load of preferred language
updatePreferredLanguage();

/**
 * Listen for changes in storage
 */
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "sync" && changes.preferredLanguage) {
    updatePreferredLanguage();
  }
});

/**
 * Listen for messages from the popup
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "translateChat") {
    translateCurrentChat(request.language);
  }
});

function translateCurrentChat() {
  const chatMessages = document.querySelectorAll("._akbu");

  chatMessages.forEach(async (message) => {
    addTranslationToMessage(message);
  });
}

async function addTranslationToMessage(messageElement) {
  /**
   * Remove existing translation if any
   */
  const existingTranslation = messageElement.querySelector(".translation-container");
  if (existingTranslation) {
    existingTranslation.remove();
  }

  /**
   * Find the text content element
   */
  const textElement = messageElement.querySelector("span.selectable-text.copyable-text");
  if (!textElement) {
    return;
  }

  /**
   * Create translation container
   */
  const translationContainer = document.createElement("div");
  translationContainer.className = "translation-container";

  /**
   * Add horizontal line
   */
  const horizontalLine = document.createElement("hr");
  horizontalLine.className = "translation-separator";
  translationContainer.appendChild(horizontalLine);

  /**
   * Send a message to the background script to get the translation
   */
  chrome.runtime.sendMessage(
    { action: "translate", text: textElement.textContent, targetLanguage: preferredLanguage || "en" },
    (response) => {
      if (response && response.translatedText) {
        // Add translated text
        const translatedContent = document.createElement("div");
        translatedContent.textContent = response.translatedText;
        translationContainer.appendChild(translatedContent);

        // Append translation container after the text content
        textElement.parentNode.insertBefore(translationContainer, textElement.nextSibling);
      } else {
        console.error("Translation failed or empty response");
      }
    }
  );
}

/**
 * Inject CSS styles
 */
function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .translation-separator {
      border: 0;
      height: 1px;
      background: linear-gradient(to right, transparent, #ffffff, #ffffff, transparent);
      margin: 8px 0;
    }

    .translate-button-div{
      width: 40px;
      height: 42px;
      display: flex;
      justify-content: center;
      align-items: center;    
    }
  `;
  document.head.appendChild(style);
}

injectStyles();

/**
 * Function to create and inject the translate button
 */
function injectTranslateButton() {
  const topLevelDiv = document.querySelector("div._ak1r");
  if (topLevelDiv && !document.getElementById("translate-button")) {
    const translateButtonDiv = document.createElement("div");
    translateButtonDiv.className = "translate-button-div";

    const translateButton = document.createElement("button");
    translateButton.id = "translate-button";
    const image = document.createElement("img");
    image.src =
      "https://lh3.googleusercontent.com/6fsY_uWjxu7t6QWza__In0vBH2sfHaG79EBw-67REerLsrw5lEcOfx3YSFzDnzyNadnMt81wIg16bptfPQ4rdtQQJQ=s60";
    image.style.width = "34px";
    image.style.height = "34px";

    translateButton.appendChild(image);
    translateButtonDiv.appendChild(translateButton);
    topLevelDiv.appendChild(translateButtonDiv);

    // Add click event listener to the translate button
    translateButton.addEventListener("click", translateMessage);
  }
}

/**
 * Function to translate the message
 */
function translateMessage() {
  const messageInput = document.querySelector('div[contenteditable="true"][data-tab="10"]');

  if (messageInput) {
    /**
     * Focus on the input to make sure it's the active element
     */
    messageInput.focus();

    const originalText = messageInput.textContent;

    /**
     * Clear existing content using CompositionEvent
     */
    const compositionStartEvent = new CompositionEvent("compositionstart");
    messageInput.dispatchEvent(compositionStartEvent);

    const compositionUpdateEvent = new CompositionEvent("compositionupdate", { data: "" });
    messageInput.dispatchEvent(compositionUpdateEvent);

    messageInput.textContent = "";

    const compositionEndEvent = new CompositionEvent("compositionend", { data: "" });
    messageInput.dispatchEvent(compositionEndEvent);

    chrome.runtime.sendMessage(
      { action: "translate", text: originalText, targetLanguage: preferredLanguage },
      (response) => {
        if (response && response.translatedText) {
          const inputEvent = new InputEvent("input", {
            bubbles: true,
            cancelable: true,
            inputType: "insertCompositionText",
            data: response.translatedText,
          });
          messageInput.dispatchEvent(inputEvent);
        }
      }
    );

    console.log("Original text:", originalText);
    console.log("Translation completed:", messageInput.textContent);
  } else {
    console.log("Message input not found");
  }
}

/**
 * Function to observe DOM changes and inject the button when possible
 */
function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    if (!document.getElementById("translate-button")) {
      injectTranslateButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Start observing the DOM
 */
observeDOM();

/**
 * Initial attempt to inject the button
 */
injectTranslateButton();
