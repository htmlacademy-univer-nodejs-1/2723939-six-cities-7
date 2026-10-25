import {HydratedDocument, Schema} from 'mongoose';
import {User} from '../../../types/user.type.js';

export type UserEntity = User & {createdAt: Date; updatedAt: Date};
export type UserDocument = HydratedDocument<UserEntity>;

export const userSchema = new Schema<UserEntity>({
  name: {type: String, required: true},
  email: {type: String, required: true, unique: true, lowercase: true, trim: true},
  avatar: {type: String, default: 'avatar.svg'},
  password: {type: String, required: true, select: false},
  type: {type: String, required: true}
}, {collection: 'users', timestamps: true});
