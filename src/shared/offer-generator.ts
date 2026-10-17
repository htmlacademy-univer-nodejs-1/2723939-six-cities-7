import {CityName, GoodsType, HousingType} from '../types/offer.type.js';
import {UserType} from '../types/user.type.js';
import {MockServerData} from '../types/mock-server-data.type.js';
import {CITY_COORDINATES, ImportedOffer} from './offer-parser.js';
import {getRandomInteger, getRandomItem, getRandomItems} from './random.js';

function isText(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.length >= min && value.length <= max && !/[\t\r\n]/.test(value);
}

export function validateMockData(data: unknown): asserts data is MockServerData {
  if (!Array.isArray(data) || !data.length) {
    throw new Error('Mock server must return a non-empty array of offer templates.');
  }
  for (const [index, template] of data.entries()) {
    if (!template || !isText(template.title, 10, 100) || !isText(template.description, 20, 1024)
      || !Object.values(CityName).includes(template.city) || !isText(template.previewImage, 1, 2048)
      || !Array.isArray(template.images) || template.images.length !== 6
      || !template.images.every((image: unknown) => isText(image, 1, 2048) && !image.includes(';'))
      || !template.author || !isText(template.author.name, 1, 15)
      || !isText(template.author.email, 3, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(template.author.email)
      || !Object.values(UserType).includes(template.author.type)
      || (template.author.avatar !== undefined && !isText(template.author.avatar, 1, 2048))) {
      throw new Error(`Invalid mock offer template at index ${index}.`);
    }
  }
}

export class OfferGenerator {
  constructor(private readonly templates: MockServerData) {}

  public generate(): ImportedOffer {
    const template = getRandomItem(this.templates);
    const [latitude, longitude] = CITY_COORDINATES[template.city];
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    return {
      ...template,
      publicationDate: new Date(Date.now() - getRandomInteger(0, maxAge)),
      city: {name: template.city, latitude, longitude},
      isPremium: Boolean(getRandomInteger(0, 1)),
      isFavorite: false,
      rating: getRandomInteger(10, 50) / 10,
      type: getRandomItem(Object.values(HousingType)),
      bedrooms: getRandomInteger(1, 8),
      maxAdults: getRandomInteger(1, 10),
      price: getRandomInteger(100, 100000),
      goods: getRandomItems(Object.values(GoodsType)),
      commentsCount: 0,
      location: {
        latitude: Number((latitude + getRandomInteger(-1000, 1000) / 100000).toFixed(6)),
        longitude: Number((longitude + getRandomInteger(-1000, 1000) / 100000).toFixed(6))
      }
    };
  }
}
