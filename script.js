
/* ========================================
   SMART TRANSLATOR — COMPLETE JAVASCRIPT
   ======================================== */

// Get HTML elements
const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");
const sourceText = document.getElementById("sourceText");
const resultText = document.getElementById("resultText");
const charCount = document.getElementById("charCount");
const resultStatus = document.getElementById("resultStatus");
const translateBtn = document.getElementById("translateBtn");
const translateLabel = document.getElementById("translateLabel");
const notice = document.getElementById("notice");

// Language flags
const flags = {
  en: "🇬🇧",
  pl: "🇵🇱",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  it: "🇮🇹",
  pt: "🇵🇹",
  nl: "🇳🇱",
  uk: "🇺🇦",
  ru: "🇷🇺",
  tr: "🇹🇷",
  ar: "🇸🇦",
  hi: "🇮🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  "zh-CN": "🇨🇳",
  sw: "🇹🇿"
};

const placeholderTranslation =
  "Your translation will appear here.";

// Store the last successful translation
let lastTranslation = "";

// Prevent an old response from replacing a newer request
let requestNumber = 0;


// ========================================
// UPDATE LANGUAGE FLAGS
// ========================================

function updateFlags() {
  const sourceFlag = document.getElementById("sourceFlag");
  const targetFlag = document.getElementById("targetFlag");

  if (sourceFlag) {
    sourceFlag.textContent = flags[sourceLang.value] || "🌐";
  }

  if (targetFlag) {
    targetFlag.textContent = flags[targetLang.value] || "🌐";
  }
}


// ========================================
// CHARACTER COUNTER
// ========================================

function updateCount() {
  charCount.textContent =
    `${sourceText.value.length} / 1000 characters`;
}

sourceText.addEventListener("input", () => {
  updateCount();
  notice.textContent = "";
});


// ========================================
// LANGUAGE CHANGE EVENTS
// ========================================

sourceLang.addEventListener("change", () => {
  updateFlags();
  resetTranslation();
});

targetLang.addEventListener("change", () => {
  updateFlags();
  resetTranslation();
});

function resetTranslation() {
  lastTranslation = "";

  resultText.textContent = placeholderTranslation;

  resultStatus.innerHTML =
    '<span class="status-dot"></span> Ready to translate';

  notice.textContent = "";
}


// ========================================
// SWAP LANGUAGES AND TEXT
// ========================================

document.getElementById("swapBtn").addEventListener("click", () => {
  const oldSourceLanguage = sourceLang.value;
  const oldTargetLanguage = targetLang.value;

  const currentSourceText = sourceText.value;
  const currentTranslation = lastTranslation;

  // Swap selected languages
  sourceLang.value = oldTargetLanguage;
  targetLang.value = oldSourceLanguage;

  // Swap text only when a successful translation exists
  if (currentTranslation) {
    sourceText.value = currentTranslation;
    resultText.textContent = currentSourceText || placeholderTranslation;
    lastTranslation = currentSourceText;
  } else {
    resultText.textContent = placeholderTranslation;
    lastTranslation = "";
  }

  updateFlags();
  updateCount();

  resultStatus.innerHTML =
    '<span class="status-dot"></span> Languages swapped';

  notice.textContent = "Languages swapped successfully.";
});


// ========================================
// CLEAR SOURCE AND RESULT TEXT
// ========================================

document.getElementById("clearBtn").addEventListener("click", () => {
  // Invalidate any pending translation request
  requestNumber++;

  sourceText.value = "";
  lastTranslation = "";

  resultText.textContent = placeholderTranslation;

  resultStatus.innerHTML =
    '<span class="status-dot"></span> Ready to translate';

  translateBtn.disabled = false;
  translateLabel.textContent = "Translate";
  notice.textContent = "";

  updateCount();

  // Stop any currently playing speech
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  sourceText.focus();
});


// ========================================
// COPY TRANSLATION
// ========================================

document.getElementById("copyBtn").addEventListener(
  "click",
  async () => {
    const text = lastTranslation;

    if (!text) {
      notice.textContent =
        "Translate some text before copying.";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for browsers without Clipboard API access
        const temporary = document.createElement("textarea");

        temporary.value = text;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";

        document.body.appendChild(temporary);
        temporary.select();

        const copied = document.execCommand("copy");
        temporary.remove();

        if (!copied) {
          throw new Error("Copy failed.");
        }
      }

      notice.textContent =
        "Translation copied to clipboard!";
    } catch {
      notice.textContent =
        "Unable to copy automatically. Select and copy the text manually.";
    }
  }
);


// ========================================
// TRANSLATE TEXT
// ========================================

translateBtn.addEventListener("click", translate);

async function translate() {
  const text = sourceText.value.trim();

  if (!text) {
    notice.textContent = "Please enter some text to translate.";
    sourceText.focus();
    return;
  }

  if (text.length > 1000) {
    notice.textContent =
      "Your text cannot exceed 1,000 characters.";
    return;
  }

  if (sourceLang.value === targetLang.value) {
    resultText.textContent = text;
    lastTranslation = text;

    resultStatus.innerHTML =
      '<span class="status-dot"></span> Same language';

    notice.textContent =
      "Choose two different languages to translate.";
    return;
  }

  // Give each request its own ID
  const currentRequest = ++requestNumber;

  translateBtn.disabled = true;
  translateLabel.textContent = "Translating...";

  resultText.textContent = "Translating...";
  resultStatus.textContent = "Please wait";
  notice.textContent = "";

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang.value}|${targetLang.value}`
    });

    const response = await fetch(
      `https://api.mymemory.translated.net/get?${params}`,
      {
        method: "GET"
      }
    );

    if (!response.ok) {
      throw new Error(
        "The translation service is temporarily unavailable."
      );
    }

    const data = await response.json();

    // Ignore outdated responses
    if (currentRequest !== requestNumber) {
      return;
    }

    if (
      data.responseStatus !== 200 ||
      !data.responseData ||
      !data.responseData.translatedText
    ) {
      throw new Error(
        data.responseDetails ||
        "The translation could not be completed."
      );
    }

    const translation = data.responseData.translatedText;

    // Display translated text safely
    resultText.textContent = translation;
    lastTranslation = translation;

    resultStatus.innerHTML =
      '<span class="status-dot"></span> Translation complete';

    notice.textContent =
      "Translation completed successfully.";

  } catch (error) {
    if (currentRequest !== requestNumber) {
      return;
    }

    lastTranslation = "";

    resultText.textContent = "Translation unavailable.";
    resultStatus.textContent = "Translation failed";

    notice.textContent =
      error.message ||
      "Unable to translate. Check your internet connection and try again.";

  } finally {
    if (currentRequest === requestNumber) {
      translateBtn.disabled = false;
      translateLabel.textContent = "Translate";
    }
  }
}


// ========================================
// TEXT-TO-SPEECH
// ========================================

function speak(text, language) {
  if (!("speechSynthesis" in window)) {
    notice.textContent =
      "Speech is not supported by your browser.";
    return;
  }

  if (!text.trim()) {
    notice.textContent = "There is no text to read aloud.";
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Use standard language codes for speech synthesis
  const speechLanguages = {
    en: "en-GB",
    pl: "pl-PL",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-PT",
    nl: "nl-NL",
    uk: "uk-UA",
    ru: "ru-RU",
    tr: "tr-TR",
    ar: "ar-SA",
    hi: "hi-IN",
    ja: "ja-JP",
    ko: "ko-KR",
    "zh-CN": "zh-CN",
    sw: "sw-TZ"
  };

  utterance.lang = speechLanguages[language] || language;

  utterance.onerror = () => {
    notice.textContent =
      "Audio playback failed. Your browser may not have a suitable voice installed.";
  };

  window.speechSynthesis.speak(utterance);
}


// Listen to original text
document.getElementById("speakSource").addEventListener(
  "click",
  () => {
    speak(sourceText.value, sourceLang.value);
  }
);


// Listen to translated text
document.getElementById("speakResult").addEventListener(
  "click",
  () => {
    if (!lastTranslation) {
      notice.textContent =
        "Translate some text before listening.";
      return;
    }

    speak(lastTranslation, targetLang.value);
  }
);


// ========================================
// INITIALIZE WEBSITE
// ========================================

updateFlags();
updateCount();