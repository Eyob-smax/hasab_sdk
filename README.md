# HasabClient SDK

The **HasabClient SDK** is a TypeScript library for interacting with the Hasab API. It provides a simple, type-safe interface for **chat**, **transcription**, **translation**, and **text-to-speech (TTS)** synthesis. Designed primarily for **Node.js** environments, it supports both synchronous and streaming features with robust error handling.

## Motivation

When I first saw the voice and text qualities of this AI for local languages, it was insane, but it was hard to send and get really simple data, so I decided to build this tool for the community.

## Links

- **GitHub Repo**: [Feel free to make PR](https://github.com/Eyob-smax/hasab_sdk)
- **My Telegram Community**: [Join my tech community](https://t.me/devwitheyob)
- **Hasab AI Website**: [The main website](https://hasab.ai)

## Features

- **Chat**: Send messages, stream responses, retrieve history, get/update titles, and clear conversations.
- **Transcription**: Upload audio for transcription and retrieve history.
- **Translation**: Translate text and retrieve history.
- **Text-to-Speech (TTS)**: Synthesize audio, stream audio, retrieve speakers, history, analytics, individual records, and delete records.

## Installation

Install the SDK via npm (assuming it's published; otherwise, clone and build locally):

```bash
npm install hasab-sdk
```

### Dependencies

- `axios`: For HTTP requests.
- `form-data`: For multipart uploads (transcription).
- `fs` (Node.js built-in): For file handling.
- `stream` (Node.js built-in): For streaming responses.

Add them if needed:

```bash
npm install axios
```

## Getting Started

### Initialization

Create a client instance with your Hasab API key:

```ts
import { HasabClient } from "hasab-client";

const client = new HasabClient({ apikey: "YOUR_HASAB_API_KEY" });
```

## Error Handling

All methods return `{ success: false, message: string }` on failure. Errors are instances of custom classes like `HasabApiError`, `HasabValidationError`, etc. Catch and handle as needed.

## Chat Features

### Send Message (Synchronous)

Send a chat message and get a full response.

**Minimal (Required Parameters Only)**:

```ts
try {
  const response = await client.chat.sendMessage({
    message: "Hello, how are you?",
  });
  if (response.success) {
    console.log("Response:", response.content);
  } else {
    console.error("Error:", response.message);
  }
} catch (error) {
  console.error("Unexpected error:", error.message);
}
```

**With Optional Parameters**:

```ts
try {
  const response = await client.chat.sendMessage(
    { message: "Hello, how are you?" },
    { model: "hasab-1-lite", temperature: 0.7, maxTokens: 512 }
  );
  if (response.success) {
    console.log("Response:", response.content);
  } else {
    console.error("Error:", response.message);
  }
} catch (error) {
  console.error("Unexpected error:", error.message);
}
```

### Stream Response

Stream chat responses in real-time. Returns a `Readable` stream.

**Minimal (Required Parameters Only)**:

```ts
import fs from "fs";
import { pipeline } from "stream/promises";

const stream = client.chat.streamResponse({ message: "Tell me a story" });

stream.on("data", (chunk) => process.stdout.write(chunk));
stream.on("error", (err) => console.error("Stream error:", err.message));
stream.on("end", () => console.log("\nDone"));

// Optional: Save to file
await pipeline(stream, fs.createWriteStream("chat_output.txt"));
```

**With Optional Parameters**:

```ts
import fs from "fs";
import { pipeline } from "stream/promises";

const stream = client.chat.streamResponse(
  { message: "Tell me a story" },
  { temperature: 0.8, model: "hasab-1-lite", maxTokens: 1024 }
);

stream.on("data", (chunk) => process.stdout.write(chunk));
stream.on("error", (err) => console.error("Stream error:", err.message));
stream.on("end", () => console.log("\nDone"));

// Optional: Save to file
await pipeline(stream, fs.createWriteStream("chat_output.txt"));
```

### Get Chat History

Retrieve conversation history. No optional parameters.

```ts
const history = await client.chat.getChatHistory();
if (history.success) {
  history.history.forEach((chat) => {
    console.log(`Chat ID: ${chat.id}, Title: ${chat.title || "Untitled"}`);
  });
} else {
  console.error("Error:", history.message);
}
```

### Get Chat Title

Get the current conversation title. No optional parameters.

```ts
const title = await client.chat.getChatTitle();
if (title.success) {
  console.log("Title:", title.title);
} else {
  console.error("Error:", title.message);
}
```

### Clear Chat

Clear the current conversation. No optional parameters.

```ts
const result = await client.chat.clearChat();
if (result.success) {
  console.log("Chat cleared:", result.message);
} else {
  console.error("Error:", result.message);
}
```

### Update Title

Update the conversation title. No optional parameters beyond required.

```ts
const result = await client.chat.updateTitle({ title: "New Title" });
if (result.success) {
  console.log("Updated:", result.message);
} else {
  console.error("Error:", result.message);
}
```

## Transcription Features

### Transcribe Audio

Upload and transcribe an audio file. Supports Buffer, Uint8Array, ArrayBuffer, string path, File, or Blob.

**Minimal (Required Parameters Only)**:

```ts
const result = await client.transcription.transcribe({
  file: "path/to/audio.mp3",
});
if (result.success) {
  console.log("Transcription:", result.transcription);
  console.log("Summary:", result.summary);
} else {
  console.error("Error:", result.message);
}
```

**With Buffer Example**:

```ts
import fs from "fs/promises";

const audioBuffer = await fs.readFile("path/to/audio.mp3");
const result = await client.transcription.transcribe({ file: audioBuffer });
if (result.success) {
  console.log("Transcription:", result.transcription);
} else {
  console.error("Error:", result.message);
}
```

### Get Transcription History

Retrieve paginated transcription jobs.

**Minimal (No Options)**:

```ts
const history = await client.transcription.getHistory();
if (history.success) {
  history.data.data.forEach((job) => {
    console.log(`ID: ${job.id}, File: ${job.original_filename}`);
  });
} else {
  console.error("Error:", history.message);
}
```

**With Optional Parameters**:

```ts
const history = await client.transcription.getHistory({ page: 2 });
if (history.success) {
  history.data.data.forEach((job) => {
    console.log(`ID: ${job.id}, File: ${job.original_filename}`);
  });
} else {
  console.error("Error:", history.message);
}
```

## Translation Features

### Translate Text

Translate text to a target language.

**Minimal (Required Parameters Only)**:

```ts
const result = await client.translate.translateText({
  text: "Hello, how are you?",
  targetLanguage: "amh",
});
if (result.success) {
  console.log("Translated:", result.data.translation.translated_text);
} else {
  console.error("Error:", result.message);
}
```

**With Optional Parameters**:

```ts
const result = await client.translate.translateText({
  text: "Hello, how are you?",
  targetLanguage: "amh",
  sourceLanguage: "eng",
});
if (result.success) {
  console.log("Translated:", result.data.translation.translated_text);
} else {
  console.error("Error:", result.message);
}
```

### Get Translation History

Retrieve translation history. No optional parameters.

```ts
const history = await client.translate.getHistory();
if (history.success) {
  history.history.forEach((item) => {
    console.log(`${item.source_text} → ${item.translated_text}`);
  });
} else {
  console.error("Error:", history.message);
}
```

## Text-to-Speech (TTS) Features

### Synthesize (Synchronous)

Generate speech audio (base64 buffer).

**Minimal (Required Parameters Only)**:

```ts
import fs from "fs/promises";

const result = await client.tts.synthesize({
  text: "Hello, this is TTS.",
  language: "eng",
});
if (result.success) {
  const buffer = Buffer.from(result.audio_buffer, "base64");
  await fs.writeFile("output.mp3", buffer);
  console.log("Audio saved.");
} else {
  console.error("Error:", result.message);
}
```

**With Optional Parameters**:

```ts
import fs from "fs/promises";

const result = await client.tts.synthesize({
  text: "Hello, this is TTS.",
  language: "eng",
  speaker_name: "default",
});
if (result.success) {
  const buffer = Buffer.from(result.audio_buffer, "base64");
  await fs.writeFile("output.mp3", buffer);
  console.log("Audio saved.");
} else {
  console.error("Error:", result.message);
}
```

### Stream Response

Stream TTS audio in real-time.

**Minimal (Required Parameters Only)**:

```ts
import fs from "fs";
import { pipeline } from "stream/promises";

const ttsStream = client.tts.streamResponse({
  text: "This is streaming TTS.",
  language: "eng",
  speaker_name: "default",
});

await pipeline(ttsStream, fs.createWriteStream("output_stream.mp3"));
console.log("Streamed audio saved.");
```

**With Optional Parameters**:

```ts
import fs from "fs";
import { pipeline } from "stream/promises";

const ttsStream = client.tts.streamResponse({
  text: "This is streaming TTS.",
  language: "eng",
  speaker_name: "default",
  sample_rate: 22050,
  timeout: 60000,
});

await pipeline(ttsStream, fs.createWriteStream("output_stream.mp3"));
console.log("Streamed audio saved.");
```

### Get Speakers

Retrieve available speakers.

**Minimal (No Language)**:

```ts
const speakers = await client.tts.getSpeakers({});
if (speakers.success) {
  console.log("All Speakers:", speakers.languages);
} else {
  console.error("Error:", speakers.message);
}
```

**With Optional Language**:

```ts
const speakers = await client.tts.getSpeakers({ language: "amh" });
if (speakers.success) {
  console.log("Amharic Speakers:", speakers.languages.amh);
} else {
  console.error("Error:", speakers.message);
}
```

### Get TTS History

Retrieve TTS synthesis history.

**Minimal (No Options)**:

```ts
const history = await client.tts.getHistory();
if (history.success) {
  history.records.forEach((r) => console.log(`ID: ${r.id}, Text: ${r.text}`));
} else {
  console.error("Error:", history.message);
}
```

**With Optional Parameters**:

```ts
const history = await client.tts.getHistory({
  limit: 10,
  offset: 0,
  status: "success",
});
if (history.success) {
  history.records.forEach((r) => console.log(`ID: ${r.id}, Text: ${r.text}`));
} else {
  console.error("Error:", history.message);
}
```

### Get TTS Analytics

Retrieve TTS usage analytics.

**Minimal (No Options)**:

```ts
const analytics = await client.tts.getAnalytics();
if (analytics.success) {
  console.log("Total Tokens:", analytics.total_tokens_used);
} else {
  console.error("Error:", analytics.message);
}
```

**With Optional Parameters**:

```ts
const analytics = await client.tts.getAnalytics({
  date_from: "2025-10-01",
  date_to: "2025-10-31",
});
if (analytics.success) {
  console.log("Total Tokens:", analytics.total_tokens_used);
} else {
  console.error("Error:", analytics.message);
}
```

### Get TTS Record

Retrieve a specific TTS record.

```ts
const record = await client.tts.getRecord({ recordId: 1 });
if (record.success) {
  console.log("Text:", record.record.text);
  console.log("Audio URL:", record.record.audio_url);
} else {
  console.error("Error:", record.message);
}
```

### Delete TTS Record

Delete a TTS record.

```ts
const result = await client.tts.deleteRecord({ recordId: 1 });
if (result.success) {
  console.log("Deleted:", result.message);
} else {
  console.error("Error:", result.message);
}
```

## Contributing

Contributions are welcome! Fork the repo, make changes, and submit a pull request.

## License

MIT License. See [LICENSE](LICENSE) for details.
