import {HydratedDocument, Schema, Types} from 'mongoose';
import {Offer} from '../../../types/offer.type.js';

export type OfferEntity = Omit<Offer, 'authorId'> & {
  authorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type OfferDocument = HydratedDocument<OfferEntity>;

const coordinates = new Schema({latitude: Number, longitude: Number}, {_id: false});
const city = new Schema({name: String, latitude: Number, longitude: Number}, {_id: false});

export const offerSchema = new Schema<OfferEntity>({
  title: {type: String, required: true},
  description: {type: String, required: true},
  publicationDate: {type: Date, required: true},
  city: {type: city, required: true},
  previewImage: {type: String, required: true},
  images: {type: [String], required: true},
  isPremium: {type: Boolean, required: true},
  isFavorite: {type: Boolean, required: true},
  rating: {type: Number, required: true},
  type: {type: String, required: true},
  bedrooms: {type: Number, required: true},
  maxAdults: {type: Number, required: true},
  price: {type: Number, required: true},
  goods: {type: [String], required: true},
  authorId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  commentsCount: {type: Number, default: 0},
  location: {type: coordinates, required: true}
}, {collection: 'offers', timestamps: true});
