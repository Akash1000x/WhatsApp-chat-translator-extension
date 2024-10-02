/**
 * Fetch languages
 */
const fetchLang = async () => {
  try {
    const response = await fetch("https://microsoft-translator-text-api3.p.rapidapi.com/languages", {
      method: "GET",
      headers: {
        "x-rapidapi-key": "Your-RapidAPI-Key",
        "x-rapidapi-host": "microsoft-translator-text-api3.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let languages = data.translation;
    let langCodes = Object.keys(languages);
    let langNames = Object.values(languages).map((lang) => lang.name);

    chrome.storage.sync.set({ languages: { langCodes, langNames } });
  } catch (error) {
    console.error("Failed to fetch languages:", error);
  }
};

// Event listeners
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated");
  fetchLang();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Chrome started");
  fetchLang();
});

/**
 * Translate text
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    const { text, targetLanguage } = request;
    fetch(
      `https://microsoft-translator-text-api3.p.rapidapi.com/translate?to=${targetLanguage}&from=en&textType=plain`,
      {
        method: "POST",
        headers: {
          "x-rapidapi-key": "Your-RapidAPI-Key",
          "x-rapidapi-host": "microsoft-translator-text-api3.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ Text: text }]),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        sendResponse({ translatedText: data[0].translations[0].text });
      })
      .catch((err) => console.error("Translation Error:", err));
    return true;
  }
});
