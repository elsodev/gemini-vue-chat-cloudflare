// Import the necessary modules
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "node:crypto";

// Create a D1 database client
const createD1Client = (env) => {
  return env.DB;
};

// Handler for the Cloudflare Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Create a D1 database client instance
    const db = createD1Client(env);

	if (request.method === 'OPTIONS') {
		return new Response(null, {
		headers: {
			'Access-Control-Allow-Origin': 'http://localhost:8081',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
		});
	}

	if (request.method === 'POST' && pathname === '/login') {
		const { email, password } = await request.json();

		// Retrieve the user from the Users table
		const { results } = await db.prepare('SELECT * FROM Users WHERE email = ?').bind(email).all();

		if (results.length === 0) {
			return new Response('Invalid email or password', { status: 401 });
		}

		const user = results[0];

		// Verify the password
		if (!verifyPassword(password, user.password)) {
			return new Response('Invalid email or password', { status: 401 });
		}

		// Generate an access token
		const accessToken = generateAccessToken();

		// Store the access token in the Sessions table
		await db.prepare('INSERT INTO Sessions (user_id, access_token) VALUES (?, ?)').bind(user.id, accessToken).run();

		return new Response(JSON.stringify({ user, accessToken }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}

	if (request.method === 'POST' && pathname === '/register') {
		const { name, email, password } = await request.json();

		// Hash the password
		const hashedPassword = hashPassword(password);

		// Check if the email already exists in the database
		const { results: emailResults } = await db.prepare('SELECT * FROM Users WHERE email = ?').bind(email).all();
		if (emailResults.length > 0) {
			return new Response('Email already exists', { status: 422 });
		}

		// Store the user information in the Users table
		const { success, error } = await db.prepare('INSERT INTO Users (name, email, password) VALUES (?, ?, ?)').bind(name, email, hashedPassword).run();

		if (!success) {
			return new Response('Error registering user', { status: 500 });
		}

		// Retrieve the newly created user
		const { results } = await db.prepare('SELECT * FROM Users WHERE email = ?').bind(email).all();
		const user = results[0];

		// Generate an access token
		const accessToken = generateAccessToken();

		// Store the access token in the Sessions table
		await db.prepare('INSERT INTO Sessions (user_id, access_token) VALUES (?, ?)').bind(user.id, accessToken).run();

		return new Response(JSON.stringify({ user, accessToken }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}

    // Authenticate the user using access token
    const userId = await authenticateUser(request, env);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (request.method === "POST" && pathname === "/chat") {
      const { message } = await request.json();

      // Initialize the Gemini API client with the API key from environment variable
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

      // Retrieve the latest user message and generate a response using Gemini API
      const latestUserMessage = message;
      const prompt = `User: ${latestUserMessage}\nBot:`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      // Store the user message and bot response in the D1 database
      await db.prepare("INSERT INTO Messages (user_id, user_message, bot_response) VALUES (?, ?, ?)")
        .bind(userId, latestUserMessage, generatedText)
        .run();

      return new Response(JSON.stringify({ response: generatedText }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "GET" && pathname === "/latest-message") {
      // Retrieve the latest message from the D1 database for the authenticated user
      const { results } = await db.prepare("SELECT * FROM Messages WHERE user_id = ? ORDER BY id DESC LIMIT 1")
        .bind(userId)
        .all();

      if (results.length === 0) {
        return new Response("No messages found", { status: 404 });
      }

      const latestMessage = results[0];

      return new Response(JSON.stringify(latestMessage), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  },
};

// Authenticate the user using access token
async function authenticateUser(request, env) {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader) {
		return null;
	}

	const accessToken = authHeader.replace('Bearer ', '');
	console.log('Access Token:', accessToken);

	const db = createD1Client(env);
	const { results } = await db.prepare('SELECT user_id FROM Sessions WHERE access_token = ?').bind(accessToken).all();

	console.log('Authentication Results:', results);

	if (results.length === 0) {
		return null;
	}

	return results[0].user_id;
  }

// Hash the password
function hashPassword(password) {
  const hash = createHash("sha256");
  hash.update(password);
  return hash.digest("hex");
}

// Verify the password
function verifyPassword(password, hashedPassword) {
  const hash = createHash("sha256");
  hash.update(password);
  const providedHashedPassword = hash.digest("hex");
  return providedHashedPassword === hashedPassword;
}

// Generate a random access token
function generateAccessToken() {
  return Math.random().toString(36).substr(2);
}
