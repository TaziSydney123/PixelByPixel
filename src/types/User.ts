interface User {
    username: string,
    status: UserStatus,
};

export enum UserStatus {
    WAITING_CONTACT = "WAITING_CONTACT",
    WAITING_SELF = "WAITING_SELF"
}

export type { User };