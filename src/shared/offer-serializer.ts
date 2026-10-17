import {ImportedOffer} from './offer-parser.js';

export function serializeOffer(offer: ImportedOffer): string {
  return [
    offer.title, offer.description, offer.publicationDate.toISOString(), offer.city.name,
    offer.previewImage, offer.images.join(';'), offer.isPremium, offer.isFavorite,
    offer.rating, offer.type, offer.bedrooms, offer.maxAdults, offer.price, offer.goods.join(';'),
    offer.author.name, offer.author.email, offer.author.avatar ?? '', offer.author.type,
    offer.commentsCount, offer.location.latitude, offer.location.longitude
  ].join('\t');
}
