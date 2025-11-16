import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  loginAttempts: number;
  lockUntil?: Date;
}

// Simulación de base de datos en memoria (reemplazar con DB real)
const users: User[] = [];

export const dbUsers = {
  async findByEmail(email: string): Promise<User | undefined> {
    return users.find(user => user.email === email);
  },

  async create(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      loginAttempts: 0,
    };
    users.push(user);
    return user;
  },

  async incrementLoginAttempts(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (user) {
      user.loginAttempts += 1;
      
      // Bloquear cuenta después de 5 intentos fallidos por 15 minutos
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
    }
  },

  async resetLoginAttempts(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (user) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }
  },

  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user || !user.lockUntil) return false;
    
    if (new Date() > user.lockUntil) {
      // Desbloquear cuenta si el tiempo ha pasado
      user.lockUntil = undefined;
      user.loginAttempts = 0;
      return false;
    }
    
    return true;
  },

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) return false;
    return bcrypt.compare(password, user.password);
  }
};