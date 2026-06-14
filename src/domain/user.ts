export type UserRole = "User" | "Admin";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
};
