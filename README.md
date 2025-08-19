# Crackit

Crackit is a web application that allows users to create, share, and take quizzes. It is built with Next.js, Supabase, and Tailwind CSS.

## Features

- **User Authentication:** Users can sign up and sign in to their accounts.
- **Create Quizzes:** Users can create quizzes by providing a topic or by uploading a file.
- **Take Quizzes:** Users can take quizzes created by other users.
- **Save and Share Quizzes:** Users can save quizzes and share them with others.
- **Review and Rate Quizzes:** Users can review and rate quizzes.

## Installation

1.  **Clone the repository:**

    ```bash
    https://github.com/tankit03/Crackit.git
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root directory and add the following environment variables:

    ```
    NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
    ```

    You can get these values from your Supabase project settings.

## Getting Started

To run the development server, use the following command:

```bash
npm run dev
```

This will start the development server on `http://localhost:3000`.

## Building for Production

To build the application for production, use the following command:

```bash
npm run build
```

This will create a production-ready build in the `.next` directory.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.

## Dependencies

- **Next.js:** A React framework for building server-side rendered and static web applications.
- **Supabase:** An open-source Firebase alternative for building secure and scalable applications.
- **Tailwind CSS:** A utility-first CSS framework for rapidly building custom user interfaces.
- **Radix UI:** A collection of accessible and unstyled UI components.
- **Lucide React:** A library of beautiful and consistent icons.
- **Geist:** A modern and minimalist font.
- **Next Themes:** A library for adding dark mode to your Next.js application.
- **Sonner:** A toast library for React.
- **date-fns:** A modern JavaScript date utility library.
- **react-confetti:** A React component for rendering confetti.
- **react-use:** A collection of useful React hooks.
- **mammoth:** A library for converting `.docx` files to HTML.
- **jszip:** A library for creating, reading, and editing `.zip` files.
- **xmldom:** A JavaScript implementation of the W3C DOM.
- **@google/generative-ai:** Google's generative AI SDK.
- **convertapi:** A file conversion API.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any suggestions or improvements.
