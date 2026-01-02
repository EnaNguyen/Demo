export interface LoginUserInput{
  password: string;
  username: string;
}
export interface RegisterUserInput{
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}