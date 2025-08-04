# Unfodl Blog

A statically generated blog built with Next.js, Markdown, and TypeScript. This blog explores emerging technologies, with a focus on blockchain and transformative technologies.

## About

This blog serves as a space to document and share the technologies I explore, starting with blockchain. Here, I break down implementation processes with the goal of deepening my own understanding, while sharing insights with others.

## Features

- **Static Generation**: Built with Next.js App Router for optimal performance
- **Markdown Support**: Blog posts written in Markdown with frontmatter
- **Syntax Highlighting**: Code snippets with Highlight.js
- **Dark/Light Mode**: Theme switcher with system preference detection
- **Responsive Design**: Optimized for all device sizes
- **TypeScript**: Full type safety throughout the application

## Demo

The blog is deployed and available at: [Your Render URL will be here]

## Deployment

### Render Deployment

This project includes a `render.yaml` file for easy deployment on Render:

1. **Connect your repository** to Render
2. **Select "Web Service"** as the service type
3. **Render will automatically detect** the configuration from `render.yaml`
4. **Deploy** - Render will run `npm install && npm run build` and start the service

### Manual Deployment

If you prefer to deploy manually:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start the production server
npm start
```

### Environment Variables

No environment variables are required for basic functionality. The blog uses static generation and doesn't require a database or external services.

## Local Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Your blog will be available at [http://localhost:3000](http://localhost:3000).

## Adding New Posts

1. Create a new Markdown file in the `_posts` directory
2. Add frontmatter with title, excerpt, coverImage, date, and author
3. Write your content in Markdown
4. The post will automatically appear on your blog

Example post structure:

```markdown
---
title: "Your Post Title"
excerpt: "A brief description of your post"
coverImage: "/assets/blog/your-post/cover.jpg"
date: "2024-01-01T00:00:00.000Z"
author:
  name: Marco Montes
  picture: "/assets/blog/authors/jj.jpeg"
---

Your content here...
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Content**: Markdown with remark/rehype
- **Syntax Highlighting**: Highlight.js
- **Language**: TypeScript
- **Deployment**: Render (configured)

## License

This project is open source and available under the [MIT License](LICENSE).
