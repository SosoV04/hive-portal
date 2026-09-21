/** Posts on the Board (feed + honeycomb Wall). Populated in prompt 3. */
export interface BoardPost {
  id: string
  author: string
  body: string
  postedAt: string
  tag: string
}

export const boardPosts: BoardPost[] = []
