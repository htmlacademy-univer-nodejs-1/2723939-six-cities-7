import {randomBytes, scryptSync} from 'node:crypto';
import {inject, injectable} from 'inversify';
import {isObjectIdOrHexString, Model} from 'mongoose';
import {User} from '../../../types/user.type.js';
import {Component} from '../../types/component.enum.js';
import {UserDocument, UserEntity} from './user.entity.js';
import {UserService} from './user-service.interface.js';

@injectable()
export class DefaultUserService implements UserService {
  constructor(@inject(Component.UserModel) private readonly model: Model<UserEntity>) {}

  public async create(data: User): Promise<UserDocument> {
    await this.model.init();
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(data.password, salt, 64).toString('hex');
    return this.model.create({...data, password: `scrypt$${salt}$${hash}`});
  }

  public async findById(id: string): Promise<UserDocument | null> {
    return isObjectIdOrHexString(id) ? this.model.findById(id).exec() : null;
  }

  public async findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({email: email.trim().toLowerCase()}).exec();
  }
}
