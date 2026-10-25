export const MOCK_TEXT_LENGTH = {
  title: {min: 10, max: 100},
  description: {min: 20, max: 1024},
  authorName: {min: 1, max: 15},
  email: {min: 3, max: 254},
  imageUrl: {min: 1, max: 2048}
} as const;

export const MOCK_IMAGES_COUNT = 6;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TSV_CONTROL_CHARACTERS_PATTERN = /[\t\r\n]/;
export const TSV_LIST_SEPARATOR = ';';
