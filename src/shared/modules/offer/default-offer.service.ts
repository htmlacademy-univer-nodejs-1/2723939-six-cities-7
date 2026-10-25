import {inject, injectable} from 'inversify';
import {isObjectIdOrHexString, Model} from 'mongoose';
import {Offer} from '../../../types/offer.type.js';
import {Component} from '../../types/component.enum.js';
import {OfferDocument, OfferEntity} from './offer.entity.js';
import {OfferService} from './offer-service.interface.js';

@injectable()
export class DefaultOfferService implements OfferService {
  constructor(@inject(Component.OfferModel) private readonly model: Model<OfferEntity>) {}

  public async create(data: Offer): Promise<OfferDocument> {
    return this.model.create(data);
  }

  public async findById(id: string): Promise<OfferDocument | null> {
    return isObjectIdOrHexString(id) ? this.model.findById(id).exec() : null;
  }
}
