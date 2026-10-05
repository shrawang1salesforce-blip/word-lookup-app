const form = document.querySelector("#search-form");
const input = document.querySelector("#word-input");
const results = document.querySelector("#results");
const statusMessage = document.querySelector("#status-message");

function setStatus(message, state = "") {
  statusMessage.dataset.state = state;
  statusMessage.lastChild.textContent = ` ${message}`;
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function renderEntry(entry) {
  results.replaceChildren();

  const heading = makeElement("div", "word-heading");
  const wordDetails = document.createElement("div");
  const title = makeElement("h2", "", entry.word);
  const phoneticText = entry.phonetic ||
    entry.phonetics.find((item) => item.text)?.text ||
    "";

  wordDetails.append(title);
  if (phoneticText) {
    wordDetails.append(makeElement("p", "phonetic", phoneticText));
  }
  heading.append(wordDetails);

  const audioUrl = entry.phonetics.find((item) => item.audio)?.audio;
  if (audioUrl) {
    const playButton = makeElement("button", "play-button");
    playButton.type = "button";
    playButton.setAttribute("aria-label", `Play pronunciation of ${entry.word}`);
    playButton.innerHTML = "<span aria-hidden=\"true\">▶</span>";
    playButton.addEventListener("click", () => {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        setStatus("Your browser couldn't play this pronunciation.", "error");
      });
    });
    heading.append(playButton);
  }

  results.append(heading);

  for (const meaning of entry.meanings) {
    const section = makeElement("section", "meaning");
    const partOfSpeech = makeElement("h3", "part-of-speech", meaning.partOfSpeech);
    const definitionList = document.createElement("ol");
    definitionList.className = "definition-list";

    for (const definition of meaning.definitions.slice(0, 4)) {
      const item = document.createElement("li");
      item.append(document.createTextNode(definition.definition));
      if (definition.example) {
        const example = makeElement("p", "example");
        const label = makeElement("span", "example-label", "Example");
        example.append(label, document.createTextNode(definition.example));
        item.append(example);
      }
      definitionList.append(item);
    }

    section.append(partOfSpeech, definitionList);
    results.append(section);
  }

  if (entry.sourceUrls?.length) {
    const source = document.createElement("a");
    source.className = "source-link";
    source.href = entry.sourceUrls[0];
    source.target = "_blank";
    source.rel = "noreferrer";
    source.textContent = "Read more about this entry ↗";
    results.append(source);
  }
}

async function lookUpWord(word) {
  results.replaceChildren();
  setStatus(`Looking up “${word}”…`, "loading");

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    if (response.status === 404) {
      setStatus(`We couldn't find “${word}”. Check the spelling and try again.`, "error");
      return;
    }

    if (!response.ok) {
      throw new Error(`Dictionary request failed (${response.status}).`);
    }

    const entries = await response.json();
    const entry = entries.find((item) => item.meanings?.length);

    if (!entry) {
      setStatus(`There are no definitions available for “${word}” yet.`, "error");
      return;
    }

    renderEntry(entry);
    setStatus(`A little more to know about “${entry.word}”.`);
  } catch (error) {
    console.error("Couldn't look up word:", error);
    setStatus("Something went wrong while looking that up. Please try again.", "error");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const word = input.value.trim();
  if (!word) {
    input.focus();
    return;
  }
  lookUpWord(word);
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.textContent;
    lookUpWord(button.textContent);
  });
});
