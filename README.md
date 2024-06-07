# Vue Gemini Chat

Vue Gemini Chat is a web application that allows users to chat with an AI-powered bot using the Google's Gemini API. It is built with Vue.js, Pinia for state management, and Tailwind CSS for styling. The backend is powered by a Cloudflare Worker, which handles user authentication and communication with the Gemini API.

Follow me [@elz0xn](https://x.com/elz0xn)

## Features

- User registration and login
- Chat interface for conversing with the Gemini AI bot
- Markdown support for chat messages
- Responsive design using Tailwind CSS with Daiysui
- Using Cloudflare Workers and Cloudflare D1 for Storasge

## Installation

1. Clone the repository:

    `git clone git@github.com:elsodev/gemini-vue-chat-cloudflare.git`

2. Navigate to the project directory:

    `cd gemini-vue-chat-cloudflare`

3. Install Dependencies at **root** directory for Vue and **at `/cloudflare`** for CF workers.

    `npm install` or `yarn`

4. Set up the Cloudflare Worker:

- `/cloudflare/src/index.js` is the main functions of the worker
- Create a `/cloudflare/wrangler.toml` , this is the configurations for your worker, env vars and [D1 Database](https://developers.cloudflare.com/d1/build-with-d1/local-development/)
- `/cloudflare/schema.sql` is the Database Schema to run for D1
    - To run for local D1, run `yarn run wrangler d1 execute vue_chat --file=./schema.sql`
- In `cloudflare/wrangler.toml`

    ```
    #:schema node_modules/wrangler/config-schema.json
    name = "gemini-chat-worker"
    main = "src/index.js"
    compatibility_date = "2024-05-29"
    compatibility_flags = ["nodejs_compat"]

    [vars]
    GEMINI_API_KEY = "REPLACE_YOUR_GEMINI_KEY"

    [[d1_databases]]
    binding = "DB" # i.e. available in your Worker on env.DB
    database_name = "vue_chat"
    database_id = "REPLACE_YOUR_D1_KEY"
    ```

## Usage

You need to start Vue App and also run local Cloudflare workers(or you can deploy to your Cloudflare account)

1. Start Cloudflare workers locally:
`yarn run wrangler dev --local`

2. You will be shown your workers local address copy that and replace `VUE_APP_CLOUDFLARE_WORKER_URL` value of `.env` at root directory (Your Vue Env)

3. Start the development server at root of the project for Vue App:
`npm run serve`

4. You will be shown local address of your Vue App being served typically `http://localhost:8080`

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
