import { groq } from "next-sanity";

export const aboutQuery = groq`
  *[_type == "about"][0] {
    photo,
    paragraphs,
    signature
  }
`;

export const merchQuery = groq`
  *[_type == "merch" && available == true] | order(order asc) {
    _id,
    name,
    description,
    price,
    image
  }
`;

export const reviewsQuery = groq`
  *[_type == "review" && featured == true] | order(_createdAt desc) {
    _id,
    platform,
    reviewerName,
    stars,
    text,
    date
  }
`;

export const galleryQuery = groq`
  *[_type == "galleryPost"] | order(order asc) {
    _id,
    image,
    caption,
    instagramUrl
  }
`;
