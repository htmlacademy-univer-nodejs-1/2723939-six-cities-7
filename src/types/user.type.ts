export enum UserType {
  Regular = 'regular',
  Pro = 'pro'
}

export type User = {
  name: string;
  email: string;
  avatar?: string;
  password: string;
  type: UserType;
};

export type UserResponse = Omit<User, 'password'>;
