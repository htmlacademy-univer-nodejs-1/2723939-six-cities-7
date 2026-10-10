import {CityName, GoodsType, HousingType, Offer} from '../types/offer.type.js';
import {UserResponse, UserType} from '../types/user.type.js';

export type ImportedOffer = Omit<Offer, 'authorId'> & {author: UserResponse};

export const TSV_HEADER = ['Title', 'Description', 'PublicationDate', 'City', 'PreviewImage',
  'Images', 'IsPremium', 'IsFavorite', 'Rating', 'Type', 'Rooms', 'Guests', 'Price', 'Goods',
  'AuthorName', 'AuthorEmail', 'AuthorAvatar', 'AuthorType', 'CommentsCount', 'Latitude', 'Longitude'].join('\t');

const CITY_COORDINATES: Record<CityName, [number, number]> = {
  [CityName.Paris]: [48.85661, 2.351499],
  [CityName.Cologne]: [50.938361, 6.959974],
  [CityName.Brussels]: [50.846557, 4.351697],
  [CityName.Amsterdam]: [52.370216, 4.895168],
  [CityName.Hamburg]: [53.550341, 10.000654],
  [CityName.Dusseldorf]: [51.225402, 6.776314]
};

function check(condition: boolean, field: string): void {
  if (!condition) {
    throw new Error(`Invalid ${field}`);
  }
}

function parseNumber(value: string, field: string): number {
  const number = Number(value);
  check(value.trim() !== '' && Number.isFinite(number), field);
  return number;
}

function parseBoolean(value: string, field: string): boolean {
  check(value === 'true' || value === 'false', field);
  return value === 'true';
}

function parseEnum<T extends string>(value: string, values: T[], field: string): T {
  const result = values.find((item) => item === value);
  if (result === undefined) {
    throw new Error(`Invalid ${field}`);
  }
  return result;
}

export function parseOffer(line: string): ImportedOffer {
  const fields = line.split('\t');
  check(fields.length === 21, 'column count (expected 21 tab-separated fields)');
  const [title, description, date, cityName, previewImage, photos, premium, favorite,
    ratingValue, housing, rooms, guests, cost, amenities, name, email, avatar, userType,
    commentCount, latitude, longitude] = fields;
  const publicationDate = new Date(date);
  check(date.trim() !== '' && !Number.isNaN(publicationDate.getTime()), 'PublicationDate');
  const city = parseEnum(cityName, Object.values(CityName), 'City');
  const [cityLatitude, cityLongitude] = CITY_COORDINATES[city];
  const images = photos.split(';');
  check(images.length === 6, 'Images (expected a tuple of 6 strings)');
  const rating = parseNumber(ratingValue, 'Rating');
  const goods = amenities.split(';').map((good) => parseEnum(good, Object.values(GoodsType), 'Goods'));
  const commentsCount = parseNumber(commentCount, 'CommentsCount');
  return {
    title, description, publicationDate,
    city: {name: city, latitude: cityLatitude, longitude: cityLongitude},
    previewImage, images: images as Offer['images'],
    isPremium: parseBoolean(premium, 'IsPremium'),
    isFavorite: parseBoolean(favorite, 'IsFavorite'),
    rating, type: parseEnum(housing, Object.values(HousingType), 'Type'),
    bedrooms: parseNumber(rooms, 'Rooms'),
    maxAdults: parseNumber(guests, 'Guests'),
    price: parseNumber(cost, 'Price'), goods,
    author: {name, email, ...(avatar ? {avatar} : {}), type: parseEnum(userType, Object.values(UserType), 'AuthorType')},
    commentsCount,
    location: {
      latitude: parseNumber(latitude, 'Latitude'),
      longitude: parseNumber(longitude, 'Longitude')
    }
  };
}
