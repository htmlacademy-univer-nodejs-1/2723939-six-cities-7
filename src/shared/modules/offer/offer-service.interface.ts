import {Offer} from '../../../types/offer.type.js';
import {OfferDocument} from './offer.entity.js';

export interface OfferService {
  create(data: Offer): Promise<OfferDocument>;
  findById(id: string): Promise<OfferDocument | null>;
}
