import {User} from '../../../types/user.type.js';
import {UserDocument} from './user.entity.js';

export interface UserService {
  create(data: User): Promise<UserDocument>;
  findById(id: string): Promise<UserDocument | null>;
  findByEmail(email: string): Promise<UserDocument | null>;
}
