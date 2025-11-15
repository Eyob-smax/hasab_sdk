# HasabClient SDK

The **HasabClient SDK** is a TypeScript library for interacting with the Hasab API. It provides a simple, type-safe interface for **chat**, **transcription**, **translation**, and **text-to-speech (TTS)** synthesis. The SDK supports both synchronous and streaming operations, with built-in error handling and support for Node.js environments.

## Features

- **Chat**: Send messages, stream responses, manage history, titles, and clear conversations.
- **Transcription**: Upload audio for transcription and retrieve history.
- **Translation**: Translate text and retrieve history.
- **Text-to-Speech (TTS)**: Synthesize audio, stream audio, retrieve speakers, history, analytics, individual records, and delete records.

## Installation

Install the SDK via npm (assuming it's published; otherwise, clone and build locally):

```bash
npm install hasab-client
```

### Dependencies

- `axios`: For HTTP requests.
- `form-data`: For multipart uploads (transcription).
- `fs` (Node.js built-in): For file handling.
- `stream` (Node.js built-in): For streaming responses.

Add them if needed:

```bash
npm install axios form-data
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

```ts
try {
  const response = await client.chat.sendMessage(
    { message: "Hello, how are you?" },
    { model: "hasab-1-lite", temperature: 0.7 }
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

```ts
import fs from "fs";
import { pipeline } from "stream/promises";

const stream = client.chat.streamResponse(
  { message: "Tell me a story" },
  { temperature: 0.8 }
);

stream.on("data", (chunk) => process.stdout.write(chunk));
stream.on("error", (err) => console.error("Stream error:", err.message));
stream.on("end", () => console.log("\nDone"));

// Optional: Save to file
await pipeline(stream, fs.createWriteStream("chat_output.txt"));
```

### Get Chat History

Retrieve conversation history.

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

Get the current conversation title.

```ts
const title = await client.chat.getChatTitle();
if (title.success) {
  console.log("Title:", title.title);
} else {
  console.error("Error:", title.message);
}
```

### Clear Chat

Clear the current conversation.

```ts
const result = await client.chat.clearChat();
if (result.success) {
  console.log("Chat cleared:", result.message);
} else {
  console.error("Error:", result.message);
}
```

### Update Title

Update the conversation title.

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

Upload and transcribe an audio file.

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

### Get Transcription History

Retrieve paginated transcription jobs.

```ts
const history = await client.transcription.getHistory({ page: 1 });
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

Retrieve translation history.

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

```ts
import fs from "fs";
import { pipeline } from "stream/promises";

const ttsStream = client.tts.streamResponse({
  text: "This is streaming TTS.",
  language: "eng",
  speaker_name: "default",
  sample_rate: 22050,
});

await pipeline(ttsStream, fs.createWriteStream("output_stream.mp3"));
console.log("Streamed audio saved.");
```

### Get Speakers

Retrieve available speakers, optionally by language.

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

```ts
const history = await client.tts.getHistory({ limit: 10 });
if (history.success) {
  history.records.forEach((r) => console.log(`ID: ${r.id}, Text: ${r.text}`));
} else {
  console.error("Error:", history.message);
}
```

### Get TTS Analytics

Retrieve TTS usage analytics.

```ts
const analytics = await client.tts.getAnalytics({ date_from: "2025-10-01" });
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
