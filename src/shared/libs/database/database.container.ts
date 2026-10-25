import {Container} from 'inversify';
import {createConnection, Connection, Model} from 'mongoose';
import {Component} from '../../types/component.enum.js';
import {UserEntity, userSchema} from '../../modules/user/user.entity.js';
import {UserService} from '../../modules/user/user-service.interface.js';
import {DefaultUserService} from '../../modules/user/default-user.service.js';
import {OfferEntity, offerSchema} from '../../modules/offer/offer.entity.js';
import {OfferService} from '../../modules/offer/offer-service.interface.js';
import {DefaultOfferService} from '../../modules/offer/default-offer.service.js';
import {DatabaseClient} from './database-client.interface.js';
import {MongoDatabaseClient} from './mongo.database-client.js';

export function registerDatabase(container: Container): void {
  container.bind<Connection>(Component.Connection).toDynamicValue(() => createConnection()).inSingletonScope();
  container.bind<DatabaseClient>(Component.DatabaseClient).to(MongoDatabaseClient).inSingletonScope();
  container.bind<Model<UserEntity>>(Component.UserModel).toDynamicValue((context) =>
    context.container.get<Connection>(Component.Connection).model<UserEntity>('User', userSchema)
  ).inSingletonScope();
  container.bind<Model<OfferEntity>>(Component.OfferModel).toDynamicValue((context) =>
    context.container.get<Connection>(Component.Connection).model<OfferEntity>('Offer', offerSchema)
  ).inSingletonScope();
  container.bind<UserService>(Component.UserService).to(DefaultUserService).inSingletonScope();
  container.bind<OfferService>(Component.OfferService).to(DefaultOfferService).inSingletonScope();
}
