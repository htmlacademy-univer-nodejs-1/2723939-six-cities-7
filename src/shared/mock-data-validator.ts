import {CityName} from '../types/offer.type.js';
import {UserResponse, UserType} from '../types/user.type.js';
import {MockOffer, MockServerData} from '../types/mock-server-data.type.js';
import {
  EMAIL_PATTERN,
  MOCK_IMAGES_COUNT,
  MOCK_TEXT_LENGTH,
  TSV_CONTROL_CHARACTERS_PATTERN,
  TSV_LIST_SEPARATOR
} from './mock-data-validation.constants.js';

type TextLength = {min: number; max: number};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown, {min, max}: TextLength): value is string {
  return typeof value === 'string'
    && value.length >= min
    && value.length <= max
    && !TSV_CONTROL_CHARACTERS_PATTERN.test(value);
}

function isImageUrl(value: unknown): value is string {
  return isText(value, MOCK_TEXT_LENGTH.imageUrl);
}

function isEmail(value: unknown): value is string {
  return isText(value, MOCK_TEXT_LENGTH.email) && EMAIL_PATTERN.test(value);
}

function isImages(value: unknown): value is MockOffer['images'] {
  return Array.isArray(value)
    && value.length === MOCK_IMAGES_COUNT
    && value.every((image: unknown) => isImageUrl(image) && !image.includes(TSV_LIST_SEPARATOR));
}

function isAuthor(value: unknown): value is UserResponse {
  if (!isRecord(value)) {
    return false;
  }
  return isText(value.name, MOCK_TEXT_LENGTH.authorName)
    && isEmail(value.email)
    && Object.values(UserType).some((type) => type === value.type)
    && (value.avatar === undefined || isImageUrl(value.avatar));
}

function isMockOffer(value: unknown): value is MockOffer {
  if (!isRecord(value)) {
    return false;
  }
  return isText(value.title, MOCK_TEXT_LENGTH.title)
    && isText(value.description, MOCK_TEXT_LENGTH.description)
    && Object.values(CityName).some((city) => city === value.city)
    && isImageUrl(value.previewImage)
    && isImages(value.images)
    && isAuthor(value.author);
}

export function validateMockData(data: unknown): asserts data is MockServerData {
  if (!Array.isArray(data) || !data.length) {
    throw new Error('Mock server must return a non-empty array of offer templates.');
  }
  for (const [index, template] of data.entries()) {
    if (!isMockOffer(template)) {
      throw new Error(`Invalid mock offer template at index ${index}.`);
    }
  }
}
