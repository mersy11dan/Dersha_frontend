// import { Repository } from "../../repository/Repository";

import { ParentRepository } from "../repository/ParentRepository";

export type SaveType<T> =
  T extends ParentRepository<infer S, any, any> ? S : never;

export type UpdateType<T> =
  T extends ParentRepository<any, infer U, any> ? U : never;

// export type FetchIdArgType<T> =
//   T extends ParentRepository<any, any, infer F, any, any, any> ? F : never;

// export type SearchArgType<T> =
//   T extends ParentRepository<any, any, any, infer SS, any, any> ? SS : never;

// export type ProductFetchedResponseType<T> =
//   T extends ParentRepository<any, any, any, any, infer PR, any> ? PR : never;
// export type ProductSearchResponseType<T> =
//   T extends ParentRepository<any, any, any, any, any, infer PS> ? PS : never;
