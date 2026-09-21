import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Our type scale uses custom names (text-caption, text-body, text-display-lg…).
 * tailwind-merge only knows Tailwind's stock t-shirt sizes, so out of the box
 * it mistakes `text-caption` for a TEXT COLOUR, decides it conflicts with a
 * real colour like `text-gold-deep` in the same className, and silently drops
 * the font size. Teaching it the scale keeps size and colour in separate
 * conflict groups so both survive.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-xl',
            'display-lg',
            'display-md',
            'body-lg',
            'body',
            'body-sm',
            'caption',
          ],
        },
      ],
    },
  },
})

/** Merge conditional classNames, with later Tailwind utilities winning conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
