import fetch from 'node-fetch';

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Ensure API key is available in environment variables
if (!apiKey) {
  throw new Error("API key is missing. Please check your environment variables.");
}

// Handle POST requests to the /api/openapi endpoint
export async function POST(req) {
  // Extract the prompt from the request body
  const { prompt } = await req.json();

  // Check if prompt is provided, otherwise return a 400 error
  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "Prompt is required" }),
      { status: 400 }
    );
  }

  try {
    // Make a request to the OpenAI API with the provided prompt
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",  // You can switch to another model if needed
        messages: [{ role: "user", content: prompt }],
      }),
    });

    // Check if the OpenAI API request was successful
    if (response.ok) {
      // Return the OpenAI response data as a JSON response
      const data = await response.json();
      return new Response(JSON.stringify(data), { status: 200 });
    } else {
      // Log and return an error if the OpenAI API request failed
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to fetch data from OpenAI API" }),
        { status: 500 }
      );
    }
  } catch (error) {
    // Log and handle any error that occurred during the request
    console.error("Request to OpenAI failed:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
