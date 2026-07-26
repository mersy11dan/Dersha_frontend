export type ChangeResponseType<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: any };

export type SearchResponseType<T> =
  | { success: true; data: T[] }
  | { success: false; error: any };

export type FetchedResponseType<T> =
  | { success: true; data?: T }
  | { success: false; error: any };

export type FetchedListReponseType<T> =
  | { success: true; data?: T[] }
  | { success: false; error: any };
