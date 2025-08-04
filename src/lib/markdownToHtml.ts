import { remark } from 'remark';
import rehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';

export default async function markdownToHtml(markdown: string) {
  const result = await remark()
    .use(rehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}