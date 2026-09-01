export type UserRole = "user" | "admin";
export interface IUser {
    _id: string;
    id: string;
    username: string;
    displayName: string;
    bio: string;
    profilePicture: string;
    profileCompleted: boolean;
    role: UserRole;
    createdAt: Date;
}
export interface IUserWithPassword extends IUser {
    passwordHash: string;
}
export declare function createUser(input: {
    username: string;
    password: string;
    role?: UserRole;
    displayName?: string;
    profileCompleted?: boolean;
}): Promise<IUser>;
export declare function createGuestUser(input?: {
    displayName?: string;
    profilePicture?: string;
    bio?: string;
}): Promise<IUser>;
export declare function findUserByUsername(username: string, role?: UserRole): Promise<IUserWithPassword | null>;
export declare function findUserById(id: string): Promise<IUser | null>;
export declare function verifyPassword(user: IUserWithPassword, candidate: string): Promise<boolean>;
export declare function updateUserProfile(id: string, update: {
    displayName?: string;
    bio?: string;
    profilePicture?: string;
    profileCompleted?: boolean;
}): Promise<IUser | null>;
export declare function updateUserProfilePicture(id: string, profilePicture: string): Promise<IUser | null>;
export declare function findAnyAdmin(): Promise<IUser | null>;
//# sourceMappingURL=User.d.ts.map