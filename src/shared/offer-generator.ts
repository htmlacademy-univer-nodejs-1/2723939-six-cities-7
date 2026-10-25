import {GoodsType, HousingType} from '../types/offer.type.js';
import {MockServerData} from '../types/mock-server-data.type.js';
import {CITY_COORDINATES, ImportedOffer} from './offer-parser.js';
import {getRandomInteger, getRandomItem, getRandomItems} from './random.js';

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
