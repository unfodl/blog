import { Post } from "@/interfaces/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
import markdownToHtml from "./markdownToHtml"; // <== Add this import

const postsDirectory = join(process.cwd(), "_posts");

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export async function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const contentHtml = await markdownToHtml(content);  // Convert markdown to HTML with prism highlighting

  return { ...data, slug: realSlug, content: contentHtml } as Post;
}

export async function getAllPosts(): Promise<Post[]> {
  const slugs = getPostSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => await getPostBySlug(slug))
  );
  // sort posts by date in descending order
  return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}