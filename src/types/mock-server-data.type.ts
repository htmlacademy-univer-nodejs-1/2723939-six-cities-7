import {CityName, Offer} from './offer.type.js';
import {UserResponse} from './user.type.js';

export type MockOffer = {
  title: string;
  description: string;
  city: CityName;
  previewImage: string;
  images: Offer['images'];
  author: UserResponse;
};

export type MockServerData = MockOffer[];
