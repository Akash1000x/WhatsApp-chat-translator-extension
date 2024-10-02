document.addEventListener("DOMContentLoaded", function () {
  const preferredLanguage = document.getElementById("preferred-language");
  const translateChat = document.getElementById("translate-chat");

  /**
   * Load saved preferred language
   */
  preferredLanguage.addEventListener("change", function () {
    const selectedLanguage = preferredLanguage.value;

    chrome.storage.sync.set({ preferredLanguage: selectedLanguage }, function () {
      console.log(`Preferred language set to: ${selectedLanguage}`);
    });
  });

  /**
   * Populate language options
   * @param {Object} languages - The languages object containing langCodes and langNames
   */
  function populateLanguageOptions(languages) {
    preferredLanguage.innerHTML = ""; // Clear previous options
    const { langCodes, langNames } = languages;

    for (let i = 0; i < langCodes.length; i++) {
      const option = document.createElement("option");
      option.value = langCodes[i];
      option.textContent = langNames[i];
      preferredLanguage.appendChild(option);
    }
    chrome.storage.sync.get("preferredLanguage", function (data) {
      if (data.preferredLanguage) {
        preferredLanguage.value = data.preferredLanguage;
      }
    });
  }

  /**
   * Fetch and populate languages
   */
  function fetchAndPopulateLanguages() {
    chrome.storage.sync.get(["languages"], ({ languages }) => {
      if (languages && languages.langCodes && languages.langNames) {
        populateLanguageOptions(languages);
      } else {
        console.log("Languages not found in storage. Waiting for background script to fetch languages...");
        setTimeout(fetchAndPopulateLanguages, 1000); // Retry after 1 second
      }
    });
  }

  fetchAndPopulateLanguages();

  /**
   * Translate current chat
   */
  translateChat.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "translateChat", language: preferredLanguage.value });
    });
  });
});
