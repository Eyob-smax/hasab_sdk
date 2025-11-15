<h1 align="center">HasabClient SDK</h1>

<p>
  The <strong>HasabClient SDK</strong> is a TypeScript library for interacting with the Hasab API.
  It provides a simple, type-safe interface for <strong>chat</strong>, <strong>transcription</strong>,
  <strong>translation</strong>, and <strong>text-to-speech (TTS)</strong> synthesis.
  Designed primarily for <strong>Node.js</strong> environments, it supports both
  synchronous and streaming features with robust error handling.
</p>

<hr/>

<h2>✨ Features</h2>
<ul>
  <li><strong>Chat:</strong> Send messages, stream responses, update titles, retrieve history, and clear conversations.</li>
  <li><strong>Transcription:</strong> Upload audio, get full text + summaries, and retrieve transcription history.</li>
  <li><strong>Translation:</strong> Translate text and retrieve translation history.</li>
  <li><strong>TTS (Text-to-Speech):</strong> Synthesize audio, stream audio, retrieve speakers, history, analytics, and manage records.</li>
</ul>

<hr/>

<h2>📦 Installation</h2>

<pre><code class="language-bash">npm install hasab-client
</code></pre>

<h3>Dependencies</h3>
<p>The SDK internally uses:</p>
<ul>
  <li><code>axios</code></li>
  <li><code>form-data</code></li>
  <li><code>fs</code> (Node built-in)</li>
  <li><code>stream</code> (Node built-in)</li>
</ul>

<p>If needed:</p>
<pre><code class="language-bash">npm install axios form-data
</code></pre>

<hr/>

<h2>🚀 Getting Started</h2>

<h3>Initialize the client</h3>

<pre><code class="language-ts">import { HasabClient, LanguageEnum } from "hasab-client";

const client = new HasabClient("YOUR_HASAB_API_KEY");
</code></pre>

<hr/>

<h2>⚠️ Error Handling</h2>
<p>
All methods return the format:
</p>

<pre><code>{
  success: boolean,
  message?: string,
}
</code></pre>

<p>Additional error types include:</p>
<ul>
  <li><code>HasabApiError</code></li>
  <li><code>HasabValidationError</code></li>
  <li><code>HasabNetworkError</code></li>
  <li><code>HasabTimeoutError</code></li>
</ul>

<hr/>

<h1>💬 Chat Features</h1>

<h2>Send Message (Synchronous)</h2>

<pre><code class="language-ts">try {
  const response = await client.chat.sendMessage("Hello, how are you?", {
    model: "hasab-1-lite",
    temperature: 0.7,
  });

  if (response.success) {
    console.log("Response:", response.content);
  } else {
    console.error("Error:", response.message);
  }
} catch (err) {
  console.error("Unexpected error:", err.message);
}
</code></pre>

<h2>Stream Chat Response</h2>

<pre><code class="language-ts">import fs from "fs";
import { pipeline } from "stream/promises";

const stream = client.chat.streamResponse("Tell me a story", { temperature: 0.8 });

stream.on("data", (chunk) => process.stdout.write(chunk));
stream.on("error", (err) => console.error("Stream error:", err.message));
stream.on("end", () => console.log("Done"));

// Save streamed output
await pipeline(stream, fs.createWriteStream("chat_output.txt"));
</code></pre>

<h2>Get Chat History</h2>

<pre><code class="language-ts">const history = await client.chat.getChatHistory();
if (history.success) {
  history.history.forEach((c) =>
    console.log(`Chat ID: ${c.id}, Title: ${c.title ?? "Untitled"}`)
  );
} else {
  console.error("Error:", history.message);
}
</code></pre>

<h2>Get Chat Title</h2>

<pre><code class="language-ts">const title = await client.chat.getChatTitle();
console.log(title.success ? title.title : title.message);
</code></pre>

<h2>Clear Chat</h2>

<pre><code class="language-ts">const result = await client.chat.clearChat();
console.log(result.message);
</code></pre>

<h2>Update Chat Title</h2>

<pre><code class="language-ts">const result = await client.chat.updateTitle("New Chat Title");
console.log(result.message);
</code></pre>

<hr/>

<h1>🎙️ Transcription Features</h1>

<h2>Transcribe Audio</h2>
<pre><code class="language-ts">const result = await client.transcription.transcribe("path/to/audio.mp3");

if (result.success) {
console.log("Text:", result.transcription);
console.log("Summary:", result.summary);
} else {
console.error("Error:", result.message);
}
</code></pre>

<h2>Get Transcription History</h2>
<pre><code class="language-ts">const history = await client.transcription.getHistory({ page: 1 });

if (history.success) {
history.data.data.forEach((job) =>
console.log(`Job ID: ${job.id}, File: ${job.original_filename}`)
);
} else {
console.error("Error:", history.message);
}
</code></pre>

<hr/>

<h1>🌏 Translation Features</h1>

<h2>Translate Text</h2>

<pre><code class="language-ts">const result = await client.translate.translateText(
  "Hello, how are you?",
  LanguageEnum.AMHARIC,
  LanguageEnum.ENGLISH
);

if (result.success) {
  console.log("Translated:", result.data.translation.translated_text);
} else {
  console.error("Error:", result.message);
}
</code></pre>

<h2>Get Translation History</h2>

<pre><code class="language-ts">const history = await client.translate.getHistory();

if (history.success) {
  history.history.forEach((item) =>
    console.log(`${item.source_text} → ${item.translated_text}`)
  );
} else {
  console.error("Error:", history.message);
}
</code></pre>

<hr/>

<h1>🔊 Text-to-Speech (TTS) Features</h1>

<h2>Synthesize (Synchronous)</h2>
<pre><code class="language-ts">import fs from "fs/promises";

const result = await client.tts.synthesize(
"Hello, this is TTS.",
LanguageEnum.ENGLISH,
"default"
);

if (result.success) {
const buffer = Buffer.from(result.audio_buffer, "base64");
await fs.writeFile("output.mp3", buffer);
console.log("Audio saved.");
} else {
console.error("Error:", result.message);
}
</code></pre>

<h2>Stream TTS Audio</h2>
<pre><code class="language-ts">import fs from "fs";
import { pipeline } from "stream/promises";

const ttsStream = client.tts.streamResponse({
text: "This is streaming TTS.",
language: LanguageEnum.ENGLISH,
speaker_name: "default",
sample_rate: 22050,
});

await pipeline(ttsStream, fs.createWriteStream("output_stream.mp3"));
console.log("Streamed audio saved.");
</code></pre>

<h2>Get Speakers</h2>
<pre><code class="language-ts">const speakers = await client.tts.getSpeakers("amh");

if (speakers.success) {
console.log("Amharic Speakers:", speakers.languages.amh);
} else {
console.error("Error:", speakers.message);
}
</code></pre>

<h2>Get TTS History</h2>
<pre><code class="language-ts">const history = await client.tts.getHistory({ limit: 10 });

if (history.success) {
history.records.forEach((r) =>
console.log(`ID: ${r.id} | Text: ${r.text}`)
);
} else {
console.error("Error:", history.message);
}
</code></pre>

<h2>Get TTS Analytics</h2>
<pre><code class="language-ts">const analytics = await client.tts.getAnalytics({
  date_from: "2025-10-01",
});

if (analytics.success) {
console.log("Total Tokens:", analytics.total_tokens_used);
} else {
console.error("Error:", analytics.message);
}
</code></pre>

<h2>Get TTS Record</h2>
<pre><code class="language-ts">const record = await client.tts.getRecord(1);

if (record.success) {
console.log("Text:", record.record.text);
console.log("Audio URL:", record.record.audio_url);
} else {
console.error("Error:", record.message);
}
</code></pre>

<h2>Delete TTS Record</h2>
<pre><code class="language-ts">const result = await client.tts.deleteRecord(1);
console.log(result.message);
</code></pre>

<hr/>

<h2>🤝 Contributing</h2>
<p>Pull requests are welcome! Fork the repo, make updates, and submit a PR.</p>

<h2>📄 License</h2>
<p>MIT License — see <code>LICENSE</code> for details.</p>
