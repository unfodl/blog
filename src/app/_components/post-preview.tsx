import Link from "next/link";
import { Post } from "@/interfaces/post";
import Avatar from "./avatar";
import CoverImage from "./cover-image";

type Props = {
  title: string;
  coverImage: string;
  author: Post["author"];
  slug: string;
  excerpt: string;
};

export function PostPreview({ title, coverImage, author, slug, excerpt }: Props) {
  return (
    <div>
      <div className="mb-5">
        <CoverImage slug={slug} title={title} src={coverImage} />
      </div>
      <h3 className="text-3xl mb-3 leading-snug">
        <Link href={`/posts/${slug}`} className="hover:underline">
          {title}
        </Link>
      </h3>
      <p className="text-lg leading-relaxed mb-4">{excerpt}</p>
      <Avatar name={author.name} picture={author.picture} />
    </div>
  );
}
