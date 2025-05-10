import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(config: AuthConfig) {
    this.jwtSecret = config.jwtSecret;
    this.jwtExpiresIn = config.jwtExpiresIn;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(user: Omit<User, 'password'>): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      this.jwtSecret,
      {
        expiresIn: this.jwtExpiresIn,
      }
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  isAdmin(user: Omit<User, 'password'>): boolean {
    return user.role === 'admin';
  }
} 