declare module "bcryptjs" {
  export function genSalt(rounds?: number): Promise<string>;
  export function hash(value: string, salt: string): Promise<string>;
  export function compare(value: string, encrypted: string): Promise<boolean>;

  const bcrypt: {
    genSalt: typeof genSalt;
    hash: typeof hash;
    compare: typeof compare;
  };

  export default bcrypt;
}
