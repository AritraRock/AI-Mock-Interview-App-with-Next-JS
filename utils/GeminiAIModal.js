// Ensure apiKey is properly set up in environment variables
import fetch from "node-fetch";
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("API key is missing. Please check your environment variables.");
}

const generationConfig = {
  temperature: 1,
  top_p: 0.95,
  max_tokens: 8192,
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { prompt } = req.body;

    const maxRetries = 5;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: generationConfig.temperature,
            top_p: generationConfig.top_p,
            max_tokens: generationConfig.max_tokens,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.choices && data.choices.length > 0) {
            const messageContent = data.choices[0].message.content;
            if (messageContent) {
              return res.status(200).json({ message: messageContent });
            } else {
              throw new Error("Response content is missing.");
            }
          } else {
            throw new Error("No content returned from OpenAI API.");
          }
        } else if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : retryDelay * attempt;
          console.warn(`Rate limit hit. Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw new Error(`Error fetching OpenAI response: ${response.status}`);
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          return res.status(500).json({ error: "Failed after multiple attempts" });
        }
      }
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
